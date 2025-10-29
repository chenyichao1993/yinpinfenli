import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';
import type { SeparationType } from '@/types';

const FREE_TIER_DURATION_LIMIT = 60; // 1 分钟 = 60 秒

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

        // 检查邮箱验证
        if (!quota.is_email_verified) {
          return NextResponse.json(
            { error: 'Please verify your email address to use your free quota.' },
            { status: 403 }
          );
        }

        // 检查配额（非付费用户）
        if (!quota.is_paid && remainingUses <= 0) {
          return NextResponse.json(
            { error: 'You have used all your free credits. Subscribe to continue using our service.' },
            { status: 403 }
          );
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

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      const ipSubnet = ip.split('.').slice(0, 3).join('.');
      const compositeKey = `${fingerprint}_${ipSubnet}`;

      const { data: anonymousUsage } = await supabase
        .from('anonymous_usage')
        .select('*')
        .eq('composite_key', compositeKey)
        .single();

      if (anonymousUsage && anonymousUsage.uses_count >= 1) {
        return NextResponse.json(
          { error: 'You have used your free trial. Please sign up to get 2 more free uses.' },
          { status: 403 }
        );
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
      jobId: job?.id || jobResponse.resultData.jobId,
      gaudiolabJobId: jobResponse.resultData.jobId
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create separation job' },
      { status: 500 }
    );
  }
}









