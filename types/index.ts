export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

export interface AudioUpload {
  id: string;
  user_id: string;
  original_filename: string;
  file_size: number;
  file_url: string;
  duration?: number;
  format: string;
  status: 'uploading' | 'uploaded' | 'failed';
  created_at: string;
}

export type SeparationType = 
  | 'vocals' 
  | 'drum' 
  | 'bass' 
  | 'electric_guitar' 
  | 'acoustic_piano'
  | 'others';

export const SEPARATION_TYPES: Record<SeparationType, { label: string; icon: string }> = {
  vocals: { label: 'Vocals', icon: '🎤' },
  drum: { label: 'Drums', icon: '🥁' },
  bass: { label: 'Bass', icon: '🎸' },
  electric_guitar: { label: 'Electric Guitar', icon: '🎸' },
  acoustic_piano: { label: 'Piano', icon: '🎹' },
  others: { label: 'Others', icon: '🎵' },
};

export type JobStatus = 'waiting' | 'running' | 'success' | 'failed';

export interface SeparationJob {
  id: string;
  user_id: string;
  audio_upload_id: string;
  gaudiolab_job_id: string;
  gaudiolab_upload_id?: string;
  status: JobStatus;
  separation_types: SeparationType[];
  expire_at?: string;
  created_at: string;
  completed_at?: string;
  audio_upload?: AudioUpload;
  separated_tracks?: SeparatedTrack[];
}

export interface SeparatedTrack {
  id: string;
  job_id: string;
  track_type: SeparationType;
  mp3_url: string;
  wav_url: string;
  file_size: number;
  created_at: string;
}

export interface GaudiolabUploadResponse {
  resultCode: number;
  resultMessage?: string;
  resultData: {
    uploadId: string;
    chunkSize: number;
    preSignedUrl: string[];
  };
}

export interface GaudiolabCompleteResponse {
  resultCode: number;
  resultMessage?: string;
}

export interface GaudiolabJobResponse {
  resultCode: number;
  resultMessage?: string;
  resultData: {
    jobId: string;
  };
}

export interface GaudiolabJobStatusResponse {
  resultCode: number;
  resultMessage?: string;
  resultData: {
    jobId: string;
    status: JobStatus;
    expireAt?: string;
    downloadUrl?: {
      [key in SeparationType]?: {
        mp3: string;
        wav: string;
      };
    };
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}







