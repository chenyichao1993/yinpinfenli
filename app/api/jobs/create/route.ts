import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GaudiolabClient } from '@/lib/gaudiolab/client';
import type { SeparationType } from '@/types';

const FREE_TIER_DURATION_LIMIT = 60; // 1 分钟 = 60 秒

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // 检查用户（可选，支持匿名用户）
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { uploadId, types, fileName, fileSize, fingerprint, audioDuration } = body;

    if (!uploadId || !types || types.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证音频时长（服务端验证）
    if (audioDuration && audioDuration > FREE_TIER_DURATION_LIMIT) {
      return NextResponse.json(
        { error: `Free users can only upload audio up to 1 minute. Your audio is ${Math.round(audioDuration)} seconds.` },
        { status: 400 }
      );
    }

    // 获取 IP 地址
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown';

    // 检查使用配额
    if (user) {
      // 登录用户：检查用户配额
      const { data: quota, error: quotaError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (quotaError && quotaError.code !== 'PGRST116') {
        throw quotaError;
      }

      if (quota) {
        const remainingUses = quota.total_free_uses - quota.used_count;

        // 检查邮箱验证（强制）
        if (!quota.is_email_verified) {
          return NextResponse.json(
            { error: 'Please verify your email address to use your free quota.' },
            { status: 403 }
          );
        }

        // 付费用户不受全局额度限制
        if (!quota.is_paid) {
          // 检查配额（非付费用户）
          if (remainingUses <= 0) {
            return NextResponse.json(
              { error: 'You have used all your free credits. Subscribe to continue using our service.' },
              { status: 403 }
            );
          }

          // 检查全局免费额度上限（30天内最多3次，IP/设备指纹）
          const globalCompositeKey = fingerprint 
            ? `${ip}_${fingerprint}` 
            : `${ip}_user_${user.id}`;
          
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: globalQuota, error: globalQuotaError } = await adminClient
            .from('global_quota_tracking')
            .select('*')
            .eq('composite_key', globalCompositeKey)
            .single();

          if (globalQuotaError && globalQuotaError.code !== 'PGRST116') {
            console.error('Error checking global quota:', globalQuotaError);
          } else if (globalQuota) {
            // 如果最后使用时间超过30天，重置计数
            if (new Date(globalQuota.last_used_at) < new Date(thirtyDaysAgo)) {
              // 重置为0（但保留记录）
              await adminClient
                .from('global_quota_tracking')
                .update({
                  uses_count: 0,
                  last_used_at: new Date().toISOString(),
                })
                .eq('composite_key', globalCompositeKey);
            } else if (globalQuota.uses_count >= 3) {
              return NextResponse.json(
                { error: 'You have reached the global free quota limit (3 uses per 30 days from this IP/device). Subscribe to continue using our service.' },
                { status: 403 }
              );
            }
          }
        }
      } else {
        // 配额记录不存在，创建一个（触发器应该会自动创建，但作为兜底）
        const { error: insertError } = await supabase.from('user_quotas').insert({
          user_id: user.id,
          total_free_uses: 2,
          used_count: 0,
          is_email_verified: !!user.email_confirmed_at,
        });
        
        if (insertError) {
          console.error('Error creating quota for existing user:', insertError);
          return NextResponse.json({ error: 'Failed to initialize user quota.' }, { status: 500 });
        }
      }
    } else {
      // 匿名用户：检查指纹配额
      if (!fingerprint) {
        return NextResponse.json(
          { error: 'Fingerprint required for anonymous usage' },
          { status: 400 }
        );
      }

      const ipSubnet = ip.split('.').slice(0, 3).join('.');
      const compositeKey = `${fingerprint}_${ipSubnet}`;

      // 检查匿名用户使用记录
      const { data: anonymousUsage, error: anonUsageError } = await adminClient
        .from('anonymous_usage')
        .select('*')
        .eq('composite_key', compositeKey)
        .single();

      // 如果查询出错（除了"未找到记录"），记录错误
      if (anonUsageError && anonUsageError.code !== 'PGRST116') {
        console.error('Error checking anonymous usage:', anonUsageError);
        // 如果查询失败，为安全起见拒绝请求
        return NextResponse.json(
          { error: 'Failed to check usage limit. Please try again.' },
          { status: 500 }
        );
      }

      // 检查是否已使用（uses_count >= 1 表示已使用过）
      if (anonymousUsage && anonymousUsage.uses_count >= 1) {
        console.log(`Anonymous user limit reached: compositeKey=${compositeKey}, uses_count=${anonymousUsage.uses_count}`);
        return NextResponse.json(
          { error: 'You have used your free trial. Please sign up to get 2 more free uses.' },
          { status: 403 }
        );
      }

      console.log(`Anonymous user check passed: compositeKey=${compositeKey}, uses_count=${anonymousUsage?.uses_count || 0}`);

      // 立即记录本次使用（原子操作，防止并发绕过限制）
      // 使用数据库的原子操作来确保一致性
      if (anonymousUsage) {
        // 如果记录已存在，说明这是并发请求或逻辑错误（不应该到这里）
        console.error(`Unexpected: anonymousUsage exists but was not caught: compositeKey=${compositeKey}, uses_count=${anonymousUsage.uses_count}`);
        return NextResponse.json(
          { error: 'You have used your free trial. Please sign up to get 2 more free uses.' },
          { status: 403 }
        );
      } else {
        // 如果记录不存在，创建新记录（uses_count = 1）
        const { data: insertedRecord, error: insertError } = await adminClient
          .from('anonymous_usage')
          .insert({
            fingerprint,
            ip_subnet: ipSubnet,
            composite_key: compositeKey,
            uses_count: 1,
            last_used_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          // 如果插入失败（可能是并发导致的重复键），再次检查
          console.log(`Insert failed (possibly concurrent), rechecking: ${insertError.message}`);
          const { data: recheckUsage, error: recheckError } = await adminClient
            .from('anonymous_usage')
            .select('*')
            .eq('composite_key', compositeKey)
            .single();

          if (recheckError && recheckError.code !== 'PGRST116') {
            console.error('Recheck error:', recheckError);
            return NextResponse.json(
              { error: 'Failed to check usage limit. Please try again.' },
              { status: 500 }
            );
          }

          if (recheckUsage && recheckUsage.uses_count >= 1) {
            console.log(`Recheck found usage: compositeKey=${compositeKey}, uses_count=${recheckUsage.uses_count}`);
            return NextResponse.json(
              { error: 'You have used your free trial. Please sign up to get 2 more free uses.' },
              { status: 403 }
            );
          }

          // 如果重新检查后仍然没有记录，可能是数据库错误，拒绝请求以保安全
          console.error('Insert failed and recheck found no record - possible database issue');
          return NextResponse.json(
            { error: 'Failed to record usage. Please try again.' },
            { status: 500 }
          );
        }

        console.log(`Anonymous usage recorded: compositeKey=${compositeKey}, uses_count=1`);
      }

      // 检查全局免费额度上限（30天内最多3次，IP/设备指纹）
      // 注意：这里检查的是即将使用后的数量，所以应该是 >= 2（使用后会变成3）
      const globalCompositeKey = `${ip}_${fingerprint}`;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: globalQuota, error: globalQuotaError } = await adminClient
        .from('global_quota_tracking')
        .select('*')
        .eq('composite_key', globalCompositeKey)
        .single();

      if (globalQuotaError && globalQuotaError.code !== 'PGRST116') {
        console.error('Error checking global quota for anonymous user:', globalQuotaError);
      } else if (globalQuota) {
        // 如果最后使用时间超过30天，重置计数
        if (new Date(globalQuota.last_used_at) < new Date(thirtyDaysAgo)) {
          console.log(`Global quota expired, resetting: compositeKey=${globalCompositeKey}`);
          // 重置为0（但保留记录）
          await adminClient
            .from('global_quota_tracking')
            .update({
              uses_count: 0,
              last_used_at: new Date().toISOString(),
            })
            .eq('composite_key', globalCompositeKey);
        } else {
          // 检查使用后的数量是否会超过限制（当前 uses_count + 1 > 3）
          console.log(`Global quota check: compositeKey=${globalCompositeKey}, current uses_count=${globalQuota.uses_count}`);
          if (globalQuota.uses_count >= 3) {
            console.log(`Global quota limit reached: compositeKey=${globalCompositeKey}, uses_count=${globalQuota.uses_count}`);
            return NextResponse.json(
              { error: 'You have reached the global free quota limit (3 uses per 30 days from this IP/device). Please sign up to continue using our service.' },
              { status: 403 }
            );
          }
        }
      } else {
        console.log(`No global quota record found: compositeKey=${globalCompositeKey}, first time use`);
      }
    }

    // Create audio upload record (only for logged-in users)
    let audioUpload = null;
    if (user) {
      const { data, error: uploadError } = await supabase
        .from('audio_uploads')
        .insert({
          user_id: user.id,
          original_filename: fileName,
          file_size: fileSize,
          file_url: '',
          format: fileName.split('.').pop()?.toLowerCase() || 'unknown',
          status: 'uploaded',
        })
        .select()
        .single();

      if (uploadError) throw uploadError;
      audioUpload = data;
    }

    // Create Gaudiolab separation job
    const client = new GaudiolabClient();
    const jobResponse = await client.createJob(uploadId, types as SeparationType[]);

    if (jobResponse.resultCode !== 1000) {
      throw new Error(jobResponse.resultMessage || 'Failed to create separation job');
    }

    // Create separation job record (only for logged-in users)
    let job = null;
    if (user && audioUpload) {
      const { data, error: jobError } = await supabase
        .from('separation_jobs')
        .insert({
          user_id: user.id,
          audio_upload_id: audioUpload.id,
          gaudiolab_job_id: jobResponse.resultData.jobId,
          gaudiolab_upload_id: uploadId,
          status: 'waiting',
          separation_types: types,
        })
        .select()
        .single();

      if (jobError) throw jobError;
      job = data;
    }

    // 记录使用（更新配额）
    const recordResponse = await fetch(`${request.nextUrl.origin}/api/usage/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint,
        jobId: job?.id,
        audioDuration: audioDuration || 0,
      }),
    });

    if (!recordResponse.ok) {
      console.error('Failed to record usage');
    }

    return NextResponse.json({
      jobId: job?.id,
      gaudiolabJobId: jobResponse.resultData.jobId,
      isAnonymous: !user
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create separation job' },
      { status: 500 }
    );
  }
}









