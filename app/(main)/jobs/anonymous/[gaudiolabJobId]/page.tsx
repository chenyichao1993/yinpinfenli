'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Clock, CheckCircle2, AlertCircle, Loader2, Music, UserPlus } from 'lucide-react';
import type { SeparatedTrack, SeparationType } from '@/types';
import { SEPARATION_TYPES, sortSeparationTypes } from '@/types';

type JobStatus = 'waiting' | 'running' | 'success' | 'failed';

interface AnonymousJobData {
  status: JobStatus;
  tracks?: SeparatedTrack[];
  progress?: number;
}

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

export default function AnonymousJobPage() {
  const params = useParams();
  const router = useRouter();
  const gaudiolabJobId = params.gaudiolabJobId as string;
  const [jobData, setJobData] = useState<AnonymousJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/gaudiolab/${gaudiolabJobId}`);
        if (!response.ok) throw new Error('Failed to fetch job status');
        
        const data = await response.json();
        setJobData(data);

        // Continue polling if job is still processing
        if (data.status === 'waiting' || data.status === 'running') {
          interval = setTimeout(fetchJobStatus, 3000); // Poll every 3 seconds
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load job status');
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();

    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [gaudiolabJobId]);

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

  if (error || !jobData) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'This job does not exist or has expired.'}</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[jobData.status];
  const StatusIcon = statusInfo.icon;

  // Sort tracks
  const sortedTracks = jobData.tracks ? sortSeparationTypes(jobData.tracks.map(t => t.track_type))
    .map(type => jobData.tracks!.find(t => t.track_type === type))
    .filter(Boolean) as SeparatedTrack[] : [];

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        {/* Sign Up Banner for Anonymous Users */}
        <Card className="glass-effect mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Want to save your results?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up now to save your separation history and get <span className="font-semibold text-primary">2 more free uses</span>!
                </p>
                <div className="flex gap-3">
                  <Link href="/register">
                    <Button>
                      Sign Up for Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                Audio Separation Result
              </h1>
              <p className="text-sm text-muted-foreground">
                Anonymous session • Results available temporarily
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="gap-2">
              <StatusIcon className={`h-4 w-4 ${jobData.status === 'running' ? 'animate-spin' : ''}`} />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Processing Status */}
        {(jobData.status === 'waiting' || jobData.status === 'running') && (
          <Card className="glass-effect mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Processing Your Audio
              </CardTitle>
              <CardDescription>
                This may take a few minutes depending on the audio length
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={jobData.progress || 0} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {jobData.status === 'waiting' ? 'Waiting in queue...' : `Processing... ${jobData.progress || 0}%`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Completed - Show Results */}
        {jobData.status === 'success' && sortedTracks.length > 0 && (
          <>
            {/* Separated Tracks */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Separated Stems</h2>
                <p className="text-muted-foreground">
                  Your audio has been successfully separated. Preview and download each stem below.
                </p>
              </div>

              <div className="grid gap-4">
                {sortedTracks.map((track) => (
                  <AudioPlayer
                    key={track.id}
                    trackType={track.track_type as SeparationType}
                    mp3Url={track.mp3_url || track.download_url}
                    wavUrl={track.wav_url || track.download_url}
                  />
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <Card className="glass-effect mt-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6 pb-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Enjoying Stem Splitter?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create an account to save your results and get 2 more free uses!
                </p>
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    <UserPlus className="h-5 w-5" />
                    Sign Up Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {/* Failed */}
        {jobData.status === 'failed' && (
          <Card className="glass-effect">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Failed</h2>
              <p className="text-muted-foreground mb-4">
                Sorry, we couldn't process your audio file. Please try again with a different file.
              </p>
              <Link href="/">
                <Button>Try Again</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

