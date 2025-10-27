'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatBytes, isValidAudioFormat, validateFileSize } from '@/lib/utils';
import type { SeparationType } from '@/types';
import { SEPARATION_TYPES } from '@/types';

interface FileUploaderProps {
  onUploadSuccess: (jobId: string) => void;
}

const MAX_FILE_SIZE = 1073741824; // 1GB
const MAX_DURATION = 1200; // 20 minutes

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    setError('');

    // Validate file format
    if (!isValidAudioFormat(droppedFile.name)) {
      setError('Invalid file format. Please upload MP3, WAV, FLAC, M4A, or MP4 files.');
      return;
    }

    // Validate file size
    if (!validateFileSize(droppedFile.size, MAX_FILE_SIZE)) {
      setError(`File size exceeds maximum limit of ${formatBytes(MAX_FILE_SIZE)}.`);
      return;
    }

    setFile(droppedFile);
    setStatus('idle');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
      const jobResponse = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          types: selectedTypes,
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!jobResponse.ok) throw new Error('Failed to create separation job');
      const jobData = await jobResponse.json();

      setProgress(100);
      setStatus('success');
      
      // Redirect to job page
      setTimeout(() => {
        onUploadSuccess(jobData.jobId);
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
    setError('');
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          )}
        >
          <input {...getInputProps()} />
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
              <span>MP3</span>
              <span>•</span>
              <span>WAV</span>
              <span>•</span>
              <span>FLAC</span>
              <span>•</span>
              <span>M4A</span>
              <span>•</span>
              <span>MP4</span>
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
                <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
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
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stem Type Selection */}
      {file && !uploading && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Select Stems to Separate</h3>
            <p className="text-sm text-muted-foreground">
              Choose which instrument stems you want to extract
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(SEPARATION_TYPES) as SeparationType[])
              .filter((type) => type !== 'vocal') // Filter out 'vocal' (single) to avoid duplicate with 'vocals'
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







