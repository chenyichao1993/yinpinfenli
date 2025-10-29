import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 检查匿名用户的使用配额
 * POST /api/usage/check-anonymous
 * Body: { fingerprint: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { fingerprint } = await request.json();

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      );
    }

    // 获取 IP 地址
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    
    // 使用 IP 子网（前3段）提高追踪效果
    const ipSubnet = ip.split('.').slice(0, 3).join('.');
    const compositeKey = `${fingerprint}_${ipSubnet}`;

    // 查询匿名使用记录
    const { data: usage, error } = await supabase
      .from('anonymous_usage')
      .select('*')
      .eq('composite_key', compositeKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 未找到记录
      console.error('Error checking anonymous usage:', error);
      return NextResponse.json(
        { error: 'Failed to check usage' },
        { status: 500 }
      );
    }

    const usesCount = usage?.uses_count || 0;
    const FREE_ANONYMOUS_USES = 1;

    // 检查是否已用完
    if (usesCount >= FREE_ANONYMOUS_USES) {
      return NextResponse.json({
        allowed: false,
        message: 'You have used your free trial. Please sign up to get 2 more free uses.',
        remainingUses: 0,
        requiresAuth: true
      });
    }

    // 还有可用次数
    return NextResponse.json({
      allowed: true,
      message: `You have 1 free trial remaining.`,
      remainingUses: FREE_ANONYMOUS_USES - usesCount,
      requiresAuth: false
    });

  } catch (error: any) {
    console.error('Error in check-anonymous:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

