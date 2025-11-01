'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

const MAX_WAIT_TIME = 30 * 60 * 1000; // 30 分钟超时

export default function AnonymousJobPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gaudiolabJobId = params.gaudiolabJobId as string;
  
  // 从 URL 参数获取用户选择的音轨类型
  const selectedTypesParam = searchParams?.get('types');
  const selectedTypes: SeparationType[] = selectedTypesParam 
    ? JSON.parse(decodeURIComponent(selectedTypesParam))
    : [];
  
  const [jobData, setJobData] = useState<AnonymousJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startTime] = useState(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // 更新等待时间显示
  useEffect(() => {
    if (jobData?.status === 'waiting' || jobData?.status === 'running') {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        setElapsedMinutes(elapsed);
      }, 60000); // 每分钟更新一次

      return () => clearInterval(timer);
    }
  }, [jobData?.status, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    const fetchJobStatus = async () => {
      try {
        // 检查是否超时
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_WAIT_TIME) {
          if (isMounted) {
            setError('Processing is taking longer than expected. Please try again or contact support.');
            setLoading(false);
          }
          return;
        }

        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 秒超时
        
        try {
          const response = await fetch(`/api/jobs/gaudiolab/${gaudiolabJobId}`, {
            cache: 'no-store', // 禁用缓存，确保每次获取最新状态
            headers: {
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal, // 添加 abort signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch job status' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch job status`);
          }
          
          const data = await response.json();
          
          // 检查返回的数据是否有错误
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (isMounted) {
            setJobData(data);
            setError(''); // 清除之前的错误

            // Continue polling if job is still processing
            if (data.status === 'waiting' || data.status === 'running') {
              interval = setTimeout(fetchJobStatus, 5000); // 改为每 5 秒轮询一次，减少服务器压力
            } else {
              setLoading(false);
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // 如果是超时错误，特殊处理
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout. The server is taking too long to respond.');
          }
          throw fetchError;
        }
      } catch (err: any) {
        console.error('Error fetching job status:', err);
        if (isMounted) {
          // 如果是超时错误，延迟后重试
          if (err.message?.includes('timeout') || err.message?.includes('Request timeout')) {
            // 超时错误，延迟后重试
            interval = setTimeout(fetchJobStatus, 10000); // 超时时每 10 秒重试
          } else if (err.message?.includes('Failed to fetch') || err.message?.includes('Network')) {
            // 网络错误，延迟后重试
            interval = setTimeout(fetchJobStatus, 10000); // 网络错误时每 10 秒重试
          } else {
            setError(err.message || 'Failed to load job status. Please refresh the page.');
            setLoading(false);
          }
        }
      }
    };

    fetchJobStatus();

    return () => {
      isMounted = false;
      if (interval) clearTimeout(interval);
    };
  }, [gaudiolabJobId, startTime, MAX_WAIT_TIME]);

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

  // Sort tracks and filter by user selection
  const sortedTracks = jobData.tracks ? sortSeparationTypes(jobData.tracks.map(t => t.track_type))
    .map(type => jobData.tracks!.find(t => t.track_type === type))
    .filter(Boolean)
    .filter((track): track is SeparatedTrack => {
      // TypeScript 类型守卫：确保 track 不是 undefined
      // 虽然 .filter(Boolean) 已经过滤了，但 TypeScript 需要这个检查来推断类型
      if (!track) return false;
      
      // 如果用户选择了 types，只显示用户选择的音轨
      if (selectedTypes.length > 0) {
        // 映射 API 返回的类型到前端类型
        // API 返回: 'vocal' -> 前端: 'vocals'
        // 未知类型（如 'accom'）不在映射表中，会被过滤掉
        const apiTypeToFrontend: Record<string, SeparationType> = {
          'vocal': 'vocals',
          'vocals': 'vocals',
          'drum': 'drum',
          'bass': 'bass',
          'electric_guitar': 'electric_guitar',
          'acoustic_piano': 'acoustic_piano',
          'others': 'others',
        };
        
        const frontendType = apiTypeToFrontend[track.track_type];
        
        // 如果类型无法映射（如 'accom'），或者映射后的类型不在用户选择列表中，则过滤掉
        if (!frontendType) {
          console.log(`Unknown track type from API, filtering out: ${track.track_type}`);
          return false;
        }
        
        return selectedTypes.includes(frontendType);
      }
      // 如果用户没有选择，显示所有音轨（向后兼容）
      return true;
    }) : [];

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
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  {jobData.status === 'waiting' ? 'Waiting in queue...' : `Processing... ${jobData.progress || 0}%`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Refresh Status
                </Button>
              </div>
              {/* 显示等待时间提示 */}
              <p className="text-xs text-muted-foreground mt-2">
                {elapsedMinutes > 5 && (
                  <span className="text-yellow-500">
                    ⏱️ This is taking longer than usual ({elapsedMinutes} minutes). If it continues, please try again.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="glass-effect mb-8 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error Loading Job Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="default">
                  Refresh Page
                </Button>
                <Link href="/">
                  <Button variant="outline">
                    Back to Home
                  </Button>
                </Link>
              </div>
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
                {sortedTracks
                  .filter(track => track.mp3_url || track.wav_url || track.download_url) // 安全过滤：确保至少有一个有效的 URL
                  .map((track) => (
                    <AudioPlayer
                      key={track.id}
                      trackType={track.track_type as SeparationType}
                      mp3Url={track.mp3_url || track.download_url || ''}
                      wavUrl={track.wav_url || track.download_url || ''}
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
                Sorry, we couldn&apos;t process your audio file. Please try again with a different file.
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

