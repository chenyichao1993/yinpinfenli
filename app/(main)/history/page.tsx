'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  FileAudio,
  History as HistoryIcon
} from 'lucide-react';
import { formatDate, formatBytes } from '@/lib/utils';
import type { SeparationJob, JobStatus } from '@/types';
import { SEPARATION_TYPES, sortSeparationTypes } from '@/types';

const STATUS_CONFIG: Record<JobStatus, { label: string; variant: any; icon: any }> = {
  waiting: { label: 'Waiting', variant: 'warning' as const, icon: Clock },
  running: { label: 'Processing', variant: 'info' as const, icon: Loader2 },
  success: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: AlertCircle },
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<SeparationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const data = await response.json();
        setJobs(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Poll for updates every 10 seconds if there are processing jobs
    const interval = setInterval(() => {
      if (jobs.some(job => job.status === 'waiting' || job.status === 'running')) {
        fetchJobs();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [jobs]);

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <HistoryIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Separation History</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage all your audio separation jobs
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="glass-effect border-destructive/50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && jobs.length === 0 && (
          <Card className="glass-effect">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <FileAudio className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Separation Jobs Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by uploading an audio file to separate it into individual instrument stems.
              </p>
              <Link href="/upload">
                <Button size="lg" className="gap-2">
                  Upload Audio File
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        {!error && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => {
              const statusInfo = STATUS_CONFIG[job.status];
              const StatusIcon = statusInfo.icon;
              
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="glass-effect hover:border-primary/50 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="rounded-lg bg-primary/10 p-3 flex-shrink-0">
                          <Music className="h-6 w-6 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate mb-1">
                                {job.audio_upload?.original_filename || 'Unknown File'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(job.created_at)}
                                {job.audio_upload?.file_size && (
                                  <> • {formatBytes(job.audio_upload.file_size)}</>
                                )}
                              </p>
                            </div>
                            <Badge variant={statusInfo.variant} className="gap-2 flex-shrink-0">
                              <StatusIcon className={`h-4 w-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Stems */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {sortSeparationTypes(job.separation_types).map((type) => {
                              const typeInfo = SEPARATION_TYPES[type];
                              if (!typeInfo) return null; // Skip unknown types
                              
                              return (
                                <div
                                  key={type}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-sm"
                                >
                                  <span>{typeInfo.icon}</span>
                                  <span>{typeInfo.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Success - Show track count */}
                          {job.status === 'success' && job.separated_tracks && (
                            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {job.separated_tracks.length} stem{job.separated_tracks.length !== 1 ? 's' : ''} ready for download
                            </div>
                          )}

                          {/* Processing */}
                          {(job.status === 'waiting' || job.status === 'running') && (
                            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              {job.status === 'waiting' ? 'In queue...' : 'Processing...'}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}







