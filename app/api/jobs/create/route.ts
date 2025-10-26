import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';
import type { SeparationType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { uploadId, types, fileName, fileSize } = body;

    if (!uploadId || !types || types.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create audio upload record
    const { data: audioUpload, error: uploadError } = await supabase
      .from('audio_uploads')
      .insert({
        user_id: user.id,
        original_filename: fileName,
        file_size: fileSize,
        file_url: '', // We don't store the actual file URL from Gaudiolab
        format: fileName.split('.').pop()?.toLowerCase() || 'unknown',
        status: 'uploaded',
      })
      .select()
      .single();

    if (uploadError) throw uploadError;

    // Create Gaudiolab separation job
    const client = new GaudiolabClient();
    const jobResponse = await client.createJob(uploadId, types as SeparationType[]);

    if (jobResponse.resultCode !== 1000) {
      throw new Error(jobResponse.resultMessage || 'Failed to create separation job');
    }

    // Create separation job record
    const { data: job, error: jobError } = await supabase
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

    return NextResponse.json({ jobId: job.id });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create separation job' },
      { status: 500 }
    );
  }
}





