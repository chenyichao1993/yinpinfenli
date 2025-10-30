'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBytes, isValidAudioFormat, validateFileSize, getAudioDuration, formatDuration } from '@/lib/audio-utils';
import { getBrowserFingerprint } from '@/lib/fingerprint';
import { useUser } from '@/hooks/useUser';
import type { SeparationType } from '@/types';
import { SEPARATION_TYPES } from '@/types';

interface FileUploaderProps {
  onUploadSuccess: (jobId: string) => void;
}

const MAX_FILE_SIZE = 1073741824; // 1GB
const MAX_DURATION = 1200; // 20 minutes
const FREE_TIER_DURATION_LIMIT = 60; // 1 minute for free users

interface UsageInfo {
  allowed: boolean;
  message?: string;
  remainingUses?: number;
  totalFreeUses?: number;
  usedCount?: number;
  isEmailVerified?: boolean;
  isPaid?: boolean;
  requiresAuth?: boolean;
  requiresVerification?: boolean;
  requiresUpgrade?: boolean;
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const { user, loading: userLoading } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<SeparationType[]>([
    'vocals',
    'drum',
    'bass',
    'electric_guitar',
    'acoustic_piano',
    'others',
  ]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(true);

  // 检查使用配额
  useEffect(() => {
    const checkUsageLimits = async () => {
      setCheckingUsage(true);
      try {
        let data: UsageInfo;
        if (user) {
          // 登录用户
          const response = await fetch('/api/usage/check-user');
          data = await response.json();
        } else {
          // 匿名用户
          const fingerprint = await getBrowserFingerprint();
          const response = await fetch('/api/usage/check-anonymous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint }),
          });
          data = await response.json();
        }
        setUsageInfo(data);
      } catch (err) {
        console.error('Failed to check usage limits:', err);
        setError('Failed to load usage limits. Please try again.');
      } finally {
        setCheckingUsage(false);
      }
    };

    if (!userLoading) {
      checkUsageLimits();
    }
  }, [user, userLoading]);

  // 验证音频文件
  const validateAudioFile = async (file: File) => {
    try {
      const duration = await getAudioDuration(file);
      if (duration > FREE_TIER_DURATION_LIMIT) {
        return {
          valid: false,
          error: `Free users can only upload audio up to 1 minute. Your audio is ${formatDuration(duration)}.`,
          duration
        };
      }
      return { valid: true, duration };
    } catch (error) {
      return {
        valid: false,
        error: 'Unable to validate audio file. Please ensure it\'s a valid audio file.',
        duration: 0
      };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    setError('');
    setFile(null);
    setAudioDuration(null);

    // Validate file format
    if (!isValidAudioFormat(droppedFile.name)) {
      setError('Invalid file format. Please upload MP3, WAV, FLAC, M4A, or MP4 files.');
      setFile(droppedFile);
      return;
    }

    // Validate file size
    if (!validateFileSize(droppedFile.size, MAX_FILE_SIZE)) {
      setError(`File size exceeds maximum limit of ${formatBytes(MAX_FILE_SIZE)}.`);
      setFile(droppedFile);
      return;
    }

    // Validate audio duration (for free users)
    const validation = await validateAudioFile(droppedFile);
    setAudioDuration(validation.duration || 0);

    if (!validation.valid) {
      setError(validation.error || 'Invalid audio file');
      setFile(droppedFile);
      return;
    }

    setFile(droppedFile);
    setStatus('idle');
    setSelectedTypes(['vocals', 'drum', 'bass', 'electric_guitar', 'acoustic_piano', 'others']);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a'],
      'video/mp4': ['.mp4'],
    },
    maxFiles: 1,
  });

  const toggleType = (type: SeparationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleUpload = async () => {
    if (!file || selectedTypes.length === 0) return;

    // Check usage limits before upload
    if (usageInfo && !usageInfo.allowed) {
      if (usageInfo.requiresAuth) {
        setError('You have used your free trial. Please sign up to get 2 more free uses.');
        return;
      }
      if (usageInfo.requiresVerification) {
        setError('Please verify your email address to use your free quota.');
        return;
      }
      if (usageInfo.requiresUpgrade) {
        setError('You have used all your free credits. Subscribe to continue using our service.');
        return;
      }
      setError(usageInfo.message || 'Usage limit reached.');
      return;
    }

    setUploading(true);
    setStatus('uploading');
    setError('');
    setProgress(0);

    try {
      // Step 1: Create upload
      setProgress(10);
      const createResponse = await fetch('/api/upload/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!createResponse.ok) throw new Error('Failed to create upload');
      const createData = await createResponse.json();

      // Step 2: Upload chunks
      setProgress(20);
      const { uploadId, chunkSize, preSignedUrl } = createData;
      const chunks = Math.ceil(file.size / chunkSize);
      const parts: Array<{ awsETag: string; partNumber: number }> = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const uploadResponse = await fetch(preSignedUrl[i], {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        const etag = uploadResponse.headers.get('etag')?.replace(/"/g, '') || '';
        parts.push({ awsETag: etag, partNumber: i + 1 });

        setProgress(20 + (60 * (i + 1)) / chunks);
      }

      // Step 3: Complete upload
      setProgress(80);
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, parts }),
      });

      if (!completeResponse.ok) throw new Error('Failed to complete upload');

      // Step 4: Create separation job
      setProgress(90);
      setStatus('processing');
      const fingerprint = await getBrowserFingerprint();
      const jobResponse = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          types: selectedTypes,
          fileName: file.name,
          fileSize: file.size,
          fingerprint,
          audioDuration,
        }),
      });

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.error || 'Failed to create separation job');
      }
      const jobData = await jobResponse.json();

      setProgress(100);
      setStatus('success');

      // Redirect to job page
      // 匿名用户：跳转到匿名结果页面（使用 Gaudiolab job ID）
      // 登录用户：跳转到数据库 job 页面
      setTimeout(() => {
        if (jobData.isAnonymous) {
          // 匿名用户：跳转到匿名结果页面
          window.location.href = `/jobs/anonymous/${jobData.gaudiolabJobId}`;
        } else {
          // 登录用户：跳转到数据库 job 页面
          onUploadSuccess(jobData.jobId);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setAudioDuration(null);
    setError('');
    setStatus('idle');
    setProgress(0);
  };

  // 移除文件并打开文件选择器
  const removeFileAndSelectNew = () => {
    removeFile();
    // 使用 react-dropzone 的 open 方法触发文件选择器
    setTimeout(() => {
      open();
    }, 100);
  };

  // 判断是否显示使用限制警告
  const showUsageLimitWarning = !checkingUsage && usageInfo && !usageInfo.allowed;
  const showInfoBanner = !checkingUsage && usageInfo && usageInfo.allowed && 
                         usageInfo.remainingUses !== undefined && 
                         usageInfo.remainingUses !== Infinity;
  // 只有正在上传或配额已用完时才禁用上传（不在加载配额时禁用）
  const disableUpload = uploading || (!checkingUsage && usageInfo && !usageInfo.allowed);

  return (
    <div className="space-y-6">
      {/* Usage Info Banner - 显示剩余使用次数 */}
      {showInfoBanner && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="text-sm text-center">
            {user ? (
              // 登录用户
              <>
                <p className="font-medium text-blue-500">
                  ✨ You have {usageInfo!.remainingUses} free {usageInfo!.remainingUses === 1 ? 'use' : 'uses'} remaining
                </p>
                <p className="text-muted-foreground mt-1">
                  {usageInfo!.isEmailVerified === false
                    ? 'Please verify your email to activate your free quota.'
                    : 'Each audio up to 1 minute'}
                </p>
              </>
            ) : (
              // 匿名用户
              <>
                <p className="font-medium text-blue-500">
                  🎁 Free Trial: {usageInfo!.remainingUses} use (1 min limit)
                </p>
                <p className="text-muted-foreground mt-1">
                  <Link href="/register" className="text-blue-500 hover:underline font-medium">
                    Sign up
                  </Link>
                  {' '}to get 2 more free uses!
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Usage Limit Warning - 配额用完时显示 */}
      {showUsageLimitWarning && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-amber-500">
              {usageInfo!.requiresAuth && 'Free Trial Used'}
              {usageInfo!.requiresVerification && 'Email Verification Required'}
              {usageInfo!.requiresUpgrade && 'Free Quota Exhausted'}
            </p>
            <p className="text-muted-foreground mt-1">
              {usageInfo!.message}
            </p>
            {usageInfo!.requiresAuth && (
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up for More</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" variant="outline">Sign In</Button>
                </Link>
              </div>
            )}
            {usageInfo!.requiresUpgrade && (
              <p className="mt-3 text-center text-muted-foreground">
                Paid subscriptions coming soon. Stay tuned!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {!file && !showUsageLimitWarning && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50',
            disableUpload && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} disabled={disableUpload} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold mb-1">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your audio file'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              <span>MP3</span> • <span>WAV</span> • <span>FLAC</span> • <span>M4A</span> • <span>MP4</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Max {formatBytes(MAX_FILE_SIZE)} • Max 20 minutes
            </p>
          </div>
        </div>
      )}

      {/* Selected File */}
      {file && (
        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <File className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(file.size)}
                  {audioDuration && ` • ${formatDuration(audioDuration)}`}
                </p>
              </div>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {status === 'uploading' && 'Uploading...'}
                  {status === 'processing' && 'Creating separation job...'}
                  {status === 'success' && 'Success!'}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Upload successful! Redirecting...
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Unable to Process</p>
            <p>{error}</p>
            
            {/* 验证错误：显示重新上传按钮 */}
            {(error.includes('only upload audio up to') ||
              error.includes('File size exceeds') ||
              error.includes('Invalid')) && (
              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={removeFileAndSelectNew}
                >
                  Upload Another File
                </Button>
              </div>
            )}

            {/* 配额错误：显示注册/登录按钮 */}
            {((error.includes('free trial') ||
              error.includes('free credits') ||
              error.includes('Usage limit') ||
              error.includes('email address')) ||
              (usageInfo && !usageInfo.allowed)) &&
              !error.includes('only upload audio up to') &&
              !error.includes('File size exceeds') &&
              !error.includes('Invalid') && (
                <div className="mt-4 flex justify-center gap-3">
                  <Link href="/register">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up for More</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" variant="outline">Sign In</Button>
                  </Link>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Stem Type Selection */}
      {file && !uploading && !showUsageLimitWarning && !error && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Select Stems to Separate</h3>
            <p className="text-sm text-muted-foreground">
              Choose which instrument stems you want to extract
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(SEPARATION_TYPES) as SeparationType[])
              .filter((type) => type !== 'vocal')
              .map((type) => {
                const info = SEPARATION_TYPES[type];
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <span className="font-medium">{info.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
          </div>

          <Button
            onClick={handleUpload}
            disabled={selectedTypes.length === 0}
            className="w-full"
            size="lg"
          >
            Start Separation ({selectedTypes.length} stem{selectedTypes.length !== 1 ? 's' : ''})
          </Button>
        </div>
      )}
    </div>
  );
}
