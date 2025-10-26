'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertCircle, Loader2, Music } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { SeparationJob, JobStatus } from '@/types';

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: any; variant: any; color: string }> = {
  waiting: {
    label: 'Waiting',
    icon: Clock,
    variant: 'warning' as const,
    color: 'text-yellow-500',
  },
  running: {
    label: 'Processing',
    icon: Loader2,
    variant: 'info' as const,
    color: 'text-blue-500',
  },
  success: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'success' as const,
    color: 'text-green-500',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    variant: 'destructive' as const,
    color: 'text-red-500',
  },
};

export default function JobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<SeparationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        
        const data = await response.json();
        setJob(data);

        // Continue polling if job is still processing
        if (data.status === 'waiting' || data.status === 'running') {
          interval = setTimeout(fetchJob, 5000); // Poll every 5 seconds
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();

    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground">{error || 'This job does not exist or has been deleted.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[job.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {job.audio_upload?.original_filename || 'Audio Separation Job'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(job.created_at)}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="gap-2">
              <StatusIcon className={`h-4 w-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Processing Status */}
        {(job.status === 'waiting' || job.status === 'running') && (
          <Card className="glass-effect mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Processing Your Audio
              </CardTitle>
              <CardDescription>
                {job.status === 'waiting' 
                  ? 'Your job is in the queue and will start processing soon...'
                  : 'Our AI is separating your audio into individual stems...'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Separating {job.separation_types.length} stem{job.separation_types.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">
                    {job.status === 'waiting' ? 'Queued' : 'Processing...'}
                  </span>
                </div>
                <Progress value={job.status === 'waiting' ? 25 : 60} />
                <p className="text-xs text-muted-foreground">
                  This usually takes 2-5 minutes depending on file size. You can leave this page and come back later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Status */}
        {job.status === 'failed' && (
          <Card className="glass-effect mb-8 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Processing Failed
              </CardTitle>
              <CardDescription>
                Something went wrong while processing your audio file. Please try uploading again.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Separated Tracks */}
        {job.status === 'success' && job.separated_tracks && job.separated_tracks.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Separated Stems</h2>
              <p className="text-muted-foreground">
                Your audio has been successfully separated. Preview and download each stem below.
              </p>
            </div>

            <div className="grid gap-4">
              {job.separated_tracks.map((track) => (
                <AudioPlayer
                  key={track.id}
                  trackType={track.track_type}
                  mp3Url={track.mp3_url}
                  wavUrl={track.wav_url}
                />
              ))}
            </div>

            {job.expire_at && (
              <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-center">
                    <Clock className="inline h-4 w-4 mr-2" />
                    Download links will expire on {formatDate(job.expire_at)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}





