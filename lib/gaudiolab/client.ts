import axios, { AxiosInstance } from 'axios';
import type {
  GaudiolabUploadResponse,
  GaudiolabCompleteResponse,
  GaudiolabJobResponse,
  GaudiolabJobStatusResponse,
  SeparationType,
} from '@/types';

const API_KEY = process.env.GAUDIOLAB_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_GAUDIOLAB_API_URL || 'https://restapi.gaudiolab.io/developers/api';

export class GaudiolabClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'x-ga-apikey': apiKey || API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create multipart upload
   */
  async createUpload(fileName: string, fileSize: number): Promise<GaudiolabUploadResponse> {
    const response = await this.client.post<GaudiolabUploadResponse>(
      '/v1/files/upload-multipart/create',
      {
        fileName,
        fileSize,
      }
    );
    return response.data;
  }

  /**
   * Upload file chunk to presigned URL
   */
  async uploadChunk(url: string, chunk: Blob): Promise<string> {
    const response = await axios.put(url, chunk, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    return response.headers.etag?.replace(/"/g, '') || '';
  }

  /**
   * Complete multipart upload
   */
  async completeUpload(
    uploadId: string,
    parts: Array<{ awsETag: string; partNumber: number }>
  ): Promise<GaudiolabCompleteResponse> {
    const response = await this.client.post<GaudiolabCompleteResponse>(
      '/v1/files/upload-multipart/complete',
      {
        uploadId,
        parts,
      }
    );
    return response.data;
  }

  /**
   * Create separation job
   * Note: gsep_music_hq_v1 model separates all 6 stems
   */
  async createJob(
    audioUploadId: string,
    types: SeparationType[]
  ): Promise<GaudiolabJobResponse> {
    // Convert frontend types to API format
    // Frontend uses "vocals" (plural), API expects "vocal" (singular)
    // Filter out "others" type as API doesn't support it
    const apiTypes = types
      .filter(t => t !== 'others') // Remove "others" as API doesn't support it
      .map(t => t === 'vocals' ? 'vocal' : t); // Convert "vocals" to "vocal"
    
    // If no valid types, use all types as fallback
    const validTypes = apiTypes.length > 0 
      ? apiTypes 
      : ['vocal', 'drum', 'bass', 'electric_guitar', 'acoustic_piano'];
    
    // Gaudiolab API expects comma-separated string
    const typeString = validTypes.join(',');
    
    const response = await this.client.post<GaudiolabJobResponse>(
      '/v1/gsep_music_hq_v1/jobs',
      {
        audioUploadId,
        type: typeString,
      }
    );
    return response.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<GaudiolabJobStatusResponse> {
    const response = await this.client.get<GaudiolabJobStatusResponse>(
      `/v1/gsep_music_hq_v1/jobs/${jobId}`
    );
    return response.data;
  }
}

export const gaudiolabClient = new GaudiolabClient();







