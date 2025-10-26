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
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    console.log('=== FORCE REFRESH JOB ===');
    console.log('Job ID:', params.id);
    console.log('Gaudiolab Job ID:', job.gaudiolab_job_id);
    console.log('Current status:', job.status);

    // Force query Gaudiolab API
    const client = new GaudiolabClient();
    const statusResponse = await client.getJobStatus(job.gaudiolab_job_id);

    console.log('Gaudiolab API Response:', JSON.stringify(statusResponse, null, 2));

    if (statusResponse.resultCode === 1000) {
      const { status: newStatus, downloadUrl, expireAt } = statusResponse.resultData;

      console.log('New Status:', newStatus);
      console.log('Has downloadUrl:', !!downloadUrl);

      if (downloadUrl) {
        console.log('Download URLs:', JSON.stringify(downloadUrl, null, 2));

        // Delete existing tracks
        const { error: deleteError } = await supabase
          .from('separated_tracks')
          .delete()
          .eq('job_id', job.id);

        if (deleteError) {
          console.error('Error deleting old tracks:', deleteError);
        } else {
          console.log('Deleted old tracks');
        }

        // Parse downloadUrl if it's a JSON string
        let parsedDownloadUrl = downloadUrl;
        if (typeof downloadUrl === 'string') {
          try {
            parsedDownloadUrl = JSON.parse(downloadUrl);
            console.log('Parsed downloadUrl from string');
          } catch (e) {
            console.error('Failed to parse downloadUrl:', e);
            parsedDownloadUrl = {};
          }
        }

        // Process tracks
        const tracks = [];
        for (const [type, urls] of Object.entries(parsedDownloadUrl)) {
          console.log(`Processing ${type}:`, urls);
          
          if (urls && typeof urls === 'object' && 'mp3' in urls && 'wav' in urls) {
            tracks.push({
              job_id: job.id,
              track_type: type as SeparationType,
              mp3_url: urls.mp3,
              wav_url: urls.wav,
              file_size: 0,
            });
          } else {
            console.warn(`Invalid format for ${type}:`, urls);
          }
        }

        console.log('Tracks to insert:', tracks.length);

        if (tracks.length > 0) {
          const { data: savedTracks, error: trackError } = await supabase
            .from('separated_tracks')
            .insert(tracks)
            .select();

          if (trackError) {
            console.error('Error saving tracks:', trackError);
            return NextResponse.json({
              success: false,
              error: trackError.message,
              gaudiolab_response: statusResponse,
            });
          } else {
            console.log('Successfully saved tracks:', savedTracks?.length);
            
            // Update job status
            await supabase
              .from('separation_jobs')
              .update({
                status: newStatus,
                expire_at: expireAt,
                completed_at: newStatus === 'success' ? new Date().toISOString() : null,
              })
              .eq('id', job.id);

            return NextResponse.json({
              success: true,
              message: `Saved ${savedTracks?.length} tracks`,
              tracks: savedTracks,
              gaudiolab_response: statusResponse,
            });
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'No tracks found in download URLs',
            gaudiolab_response: statusResponse,
          });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'No downloadUrl in response',
          gaudiolab_response: statusResponse,
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Gaudiolab API error: ${statusResponse.resultMessage}`,
        gaudiolab_response: statusResponse,
      });
    }
  } catch (error: any) {
    console.error('Error in force-refresh:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

