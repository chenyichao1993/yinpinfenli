import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 记录使用（更新配额）
 * POST /api/usage/record
 * Body: { fingerprint: string, jobId: string, audioDuration: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
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

        // 更新全局额度追踪（仅非付费用户）
        if (!quota.is_paid) {
          const globalCompositeKey = fingerprint 
            ? `${ip}_${fingerprint}` 
            : `${ip}_user_${user.id}`;

          const { data: globalQuota, error: globalQuotaError } = await adminClient
            .from('global_quota_tracking')
            .select('*')
            .eq('composite_key', globalCompositeKey)
            .single();

          if (globalQuotaError && globalQuotaError.code !== 'PGRST116') {
            console.error('Error checking global quota tracking:', globalQuotaError);
          } else if (globalQuota) {
            // 更新现有记录
            await adminClient
              .from('global_quota_tracking')
              .update({
                uses_count: globalQuota.uses_count + 1,
                last_used_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('composite_key', globalCompositeKey);
          } else {
            // 创建新记录
            await adminClient.from('global_quota_tracking').insert({
              ip_address: ip,
              fingerprint: fingerprint || `user_${user.id}`,
              composite_key: globalCompositeKey,
              uses_count: 1,
              last_used_at: new Date().toISOString(),
            });
          }
        }
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
      // 匿名用户的使用记录已在 jobs/create 接口中立即记录（防止并发绕过限制）
      // 这里不再重复记录，只更新全局额度追踪

      // 更新全局额度追踪（匿名用户）
      const globalCompositeKey = `${ip}_${fingerprint}`;
      const { data: globalQuota, error: globalQuotaError } = await adminClient
        .from('global_quota_tracking')
        .select('*')
        .eq('composite_key', globalCompositeKey)
        .single();

      if (globalQuotaError && globalQuotaError.code !== 'PGRST116') {
        console.error('Error checking global quota tracking for anonymous:', globalQuotaError);
      } else if (globalQuota) {
        // 更新现有记录
        await adminClient
          .from('global_quota_tracking')
          .update({
            uses_count: globalQuota.uses_count + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('composite_key', globalCompositeKey);
      } else {
        // 创建新记录
        await adminClient.from('global_quota_tracking').insert({
          ip_address: ip,
          fingerprint: fingerprint,
          composite_key: globalCompositeKey,
          uses_count: 1,
          last_used_at: new Date().toISOString(),
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

