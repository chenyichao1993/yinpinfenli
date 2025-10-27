import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';
import type { SeparationType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get job from database
    const { data: job, error: jobError } = await supabase
      .from('separation_jobs')
      .select(`
        *,
        audio_upload:audio_uploads(*),
        separated_tracks(*)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (jobError) throw jobError;
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // If job is still processing, check status with Gaudiolab
    if (job.status === 'waiting' || job.status === 'running') {
      const client = new GaudiolabClient();
      const statusResponse = await client.getJobStatus(job.gaudiolab_job_id);

      if (statusResponse.resultCode === 1000) {
        const newStatus = statusResponse.resultData.status;

        // Update job status
        await supabase
          .from('separation_jobs')
          .update({
            status: newStatus,
            expire_at: statusResponse.resultData.expireAt,
            completed_at: newStatus === 'success' ? new Date().toISOString() : null,
          })
          .eq('id', job.id);

        job.status = newStatus;
        job.expire_at = statusResponse.resultData.expireAt;

        // If successful, save track URLs
        if (newStatus === 'success' && statusResponse.resultData.downloadUrl) {
          let downloadUrls = statusResponse.resultData.downloadUrl;
          
          // Parse if it's a JSON string
          if (typeof downloadUrls === 'string') {
            try {
              downloadUrls = JSON.parse(downloadUrls);
            } catch (e) {
              console.error('Failed to parse downloadUrl:', e);
              downloadUrls = {};
            }
          }
          
          const tracks = [];
          const userSelectedTypes = job.separation_types || []; // 用户选择的类型

          for (const [type, urls] of Object.entries(downloadUrls)) {
            // 只处理用户选择的类型
            if (!userSelectedTypes.includes(type)) {
              continue;
            }
            
            if (urls && typeof urls === 'object' && 'mp3' in urls && 'wav' in urls) {
              tracks.push({
                job_id: job.id,
                track_type: type as SeparationType,
                mp3_url: urls.mp3,
                wav_url: urls.wav,
                file_size: 0,
              });
            }
          }

          if (tracks.length > 0) {
            const { error: trackError } = await supabase
              .from('separated_tracks')
              .insert(tracks)
              .select();

            if (trackError) {
              console.error('Error saving tracks:', trackError);
            } else {
              // Fetch updated job with tracks
              const { data: updatedJob } = await supabase
                .from('separation_jobs')
                .select(`
                  *,
                  audio_upload:audio_uploads(*),
                  separated_tracks(*)
                `)
                .eq('id', job.id)
                .single();
              
              if (updatedJob) {
                job.separated_tracks = updatedJob.separated_tracks;
              }
            }
          }
        }
      }
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}







