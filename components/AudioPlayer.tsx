'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, formatDuration, downloadFile } from '@/lib/utils';
import type { SeparationType } from '@/types';
import { SEPARATION_TYPES } from '@/types';

interface AudioPlayerProps {
  trackType: SeparationType;
  mp3Url: string;
  wavUrl: string;
  className?: string;
}

export function AudioPlayer({ trackType, mp3Url, wavUrl, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const trackInfo = SEPARATION_TYPES[trackType] || { label: trackType, icon: '🎵' };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    audio.currentTime = percentage * duration;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = (url: string, format: 'mp3' | 'wav') => {
    const filename = `${trackType}_${Date.now()}.${format}`;
    downloadFile(url, filename);
  };

  return (
    <div className={cn('glass-effect rounded-lg p-4', className)}>
      <audio ref={audioRef} src={mp3Url} preload="metadata" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xl">{trackInfo.icon}</span>
          </div>
          <div>
            <h4 className="font-semibold">{trackInfo.label}</h4>
            <p className="text-xs text-muted-foreground">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="relative h-2 w-full bg-secondary rounded-full cursor-pointer mb-4 group"
        onClick={handleProgressClick}
      >
        <div
          className="absolute h-full bg-primary rounded-full transition-all group-hover:bg-primary/80"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className="gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(mp3Url, 'mp3')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            MP3
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(wavUrl, 'wav')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            WAV
          </Button>
        </div>
      </div>
    </div>
  );
}







