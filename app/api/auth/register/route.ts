import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { proxyFetch } from '@/lib/supabase/proxy-fetch';
import { isEmailAllowed } from '@/lib/disposable-emails';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();
    
    // 邮箱格式和一次性邮箱检查
    const allow = isEmailAllowed(email);
    if (!allow.ok) {
      return NextResponse.json({ error: allow.reason }, { status: 400 });
    }

    // 获取 IP 地址
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';

    // 检查注册频率限制（使用 admin client）
    const adminClient = createAdminClient();

    // 检查 5 分钟内注册尝试次数（同一 IP）- 瞬时限制，防止暴力请求
    // 注意：这里统计所有尝试（包括失败的），所以即使注册失败也要记录
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await adminClient
      .from('registration_ip_tracking')
      .select('*')
      .eq('ip_address', ip)
      .gte('registered_at', fiveMinutesAgo);

    if (attemptsError) {
      console.error('Error checking recent registration attempts:', attemptsError);
    } else if (recentAttempts && recentAttempts.length >= 3) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    // 检查 24 小时内是否已成功注册（同一 IP）- 只查询有 user_id 的记录
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRegistrations, error: recentError } = await adminClient
      .from('registration_ip_tracking')
      .select('*')
      .eq('ip_address', ip)
      .not('user_id', 'is', null) // 只查询成功的注册（有 user_id）
      .gte('registered_at', oneDayAgo);

    if (recentError) {
      console.error('Error checking recent registrations:', recentError);
    } else if (recentRegistrations && recentRegistrations.length > 0) {
      return NextResponse.json(
        { error: 'You can only register once per 24 hours from this IP address. Please try again later.' },
        { status: 429 }
      );
    }

    // 检查一年内是否已成功注册 3 次（同一 IP）- 只查询有 user_id 的记录
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { data: yearlyRegistrations, error: yearlyError } = await adminClient
      .from('registration_ip_tracking')
      .select('*')
      .eq('ip_address', ip)
      .not('user_id', 'is', null) // 只查询成功的注册（有 user_id）
      .gte('registered_at', oneYearAgo);

    if (yearlyError) {
      console.error('Error checking yearly registrations:', yearlyError);
    } else if (yearlyRegistrations && yearlyRegistrations.length >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum registration limit (3 accounts per year from this IP address).' },
        { status: 429 }
      );
    }

    // 记录本次尝试（用于5分钟限制计数，无论成功失败都记录）
    // 如果注册成功，会在成功后更新这条记录，添加 user_id
    let attemptRecordId: string | null = null;
    try {
      const { data: attemptRecord, error: insertError } = await adminClient
        .from('registration_ip_tracking')
        .insert({
          ip_address: ip,
          user_id: null, // 暂时为空，如果注册成功会更新
          registered_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error recording registration attempt:', insertError);
      } else {
        attemptRecordId = attemptRecord?.id || null;
      }
    } catch (trackingError) {
      // 如果插入失败（比如数据库错误），不影响主流程，只记录错误
      console.error('Error recording registration attempt:', trackingError);
    }
    const cookieStore = cookies();
    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
              response.cookies.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
        global: {
          fetch: proxyFetch,
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
        emailRedirectTo: `${request.nextUrl.origin}/login`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // 注册成功后，更新之前记录的尝试记录，添加 user_id
    if (data.user && attemptRecordId) {
      try {
        await adminClient
          .from('registration_ip_tracking')
          .update({
            user_id: data.user.id,
          })
          .eq('id', attemptRecordId);
      } catch (trackingError) {
        console.error('Error updating registration attempt with user_id:', trackingError);
        // 不影响注册流程，只记录错误
        // 如果更新失败，尝试插入新记录作为兜底
        try {
          await adminClient.from('registration_ip_tracking').insert({
            ip_address: ip,
            user_id: data.user.id,
            registered_at: new Date().toISOString(),
          });
        } catch (insertError) {
          console.error('Error inserting registration record as fallback:', insertError);
        }
      }
    }

    return NextResponse.json(
      { success: true, user: data.user },
      { 
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

