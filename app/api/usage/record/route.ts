import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 记录使用（更新配额）
 * POST /api/usage/record
 * Body: { fingerprint: string, jobId: string, audioDuration: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { fingerprint, jobId, audioDuration } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    
    // 获取 IP 地址
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';

    // 记录到使用历史
    await supabase.from('usage_history').insert({
      user_id: user?.id,
      job_id: jobId,
      ip_address: ip,
      fingerprint: fingerprint,
      audio_duration: audioDuration,
      is_free_tier: true,
    });

    if (user) {
      // 更新登录用户配额
      const { data: quota, error: quotaError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (quotaError && quotaError.code !== 'PGRST116') {
        throw quotaError;
      }

      if (quota) {
        // 增加使用次数
        await supabase
          .from('user_quotas')
          .update({ 
            used_count: quota.used_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // 如果配额不存在，创建一个并标记已使用 1 次
        await supabase.from('user_quotas').insert({
          user_id: user.id,
          total_free_uses: 2,
          used_count: 1,
          is_email_verified: !!user.email_confirmed_at,
        });
      }
    } else {
      // 更新匿名用户使用记录
      const ipSubnet = ip.split('.').slice(0, 3).join('.');
      const compositeKey = `${fingerprint}_${ipSubnet}`;

      const { data: anonymousUsage, error: anonError } = await supabase
        .from('anonymous_usage')
        .select('*')
        .eq('composite_key', compositeKey)
        .single();

      if (anonError && anonError.code !== 'PGRST116') {
        throw anonError;
      }

      if (anonymousUsage) {
        // 增加使用次数
        await supabase
          .from('anonymous_usage')
          .update({ 
            uses_count: anonymousUsage.uses_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('composite_key', compositeKey);
      } else {
        // 创建新记录
        await supabase.from('anonymous_usage').insert({
          fingerprint,
          ip_address: ip,
          ip_subnet: ipSubnet,
          composite_key: compositeKey,
          uses_count: 1,
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record usage' },
      { status: 500 }
    );
  }
}

