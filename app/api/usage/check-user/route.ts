import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 检查登录用户的使用配额
 * GET /api/usage/check-user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户配额
    const { data: quota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (quotaError) {
      console.error('Error fetching user quota:', quotaError);

      // 如果配额不存在，创建一个（触发器应该会自动创建，但作为兜底）
      if (quotaError.code === 'PGRST116') {
        const { data: newQuota, error: insertError } = await supabase
          .from('user_quotas')
          .insert({
            user_id: user.id,
            total_free_uses: 2,
            used_count: 0,
            is_email_verified: !!user.email_confirmed_at
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user quota:', insertError);
          return NextResponse.json(
            { error: 'Failed to create user quota' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          allowed: true,
          message: `${newQuota.total_free_uses} free uses remaining.`,
          remainingUses: newQuota.total_free_uses,
          totalFreeUses: newQuota.total_free_uses,
          usedCount: 0,
          isEmailVerified: newQuota.is_email_verified,
          isPaid: false
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch user quota' },
        { status: 500 }
      );
    }

    // 计算剩余次数
    const remainingUses = quota.total_free_uses - quota.used_count;

    // 检查邮箱是否验证
    if (!quota.is_email_verified && !user.email_confirmed_at) {
      return NextResponse.json({
        allowed: false,
        message: 'Please verify your email address to use your free quota.',
        remainingUses: 0,
        requiresVerification: true,
        isEmailVerified: false
      });
    }

    // 付费用户无限制
    if (quota.is_paid) {
      return NextResponse.json({
        allowed: true,
        message: 'Unlimited uses for paid users.',
        remainingUses: Infinity,
        isPaid: true
      });
    }

    // 检查免费配额是否用完
    if (remainingUses <= 0) {
      return NextResponse.json({
        allowed: false,
        message: 'You have used all your free credits. Subscribe to continue using our service.',
        remainingUses: 0,
        requiresUpgrade: true
      });
    }

    // 返回可用配额
    return NextResponse.json({
      allowed: true,
      message: `${remainingUses} free ${remainingUses === 1 ? 'use' : 'uses'} remaining.`,
      remainingUses,
      totalFreeUses: quota.total_free_uses,
      usedCount: quota.used_count,
      isEmailVerified: true,
      isPaid: false
    });

  } catch (error: any) {
    console.error('Error in check-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

