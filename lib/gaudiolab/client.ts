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
    // According to official docs, API supports: vocals, drums, bass, electric_guitar, acoustic_piano, and others
    // We keep all types as user selected - API should support them
    const apiTypes = types
      .map(t => t === 'vocals' ? 'vocal' : t); // Convert "vocals" to "vocal", keep others as is
    
    // If no valid types, use all supported types as fallback
    const validTypes = apiTypes.length > 0 
      ? apiTypes 
      : ['vocal', 'drum', 'bass', 'electric_guitar', 'acoustic_piano', 'others'];
    
    // Gaudiolab API expects comma-separated string
    const typeString = validTypes.join(',');
    
    console.log(`[GaudiolabClient] Creating job with types: ${typeString}`);
    console.log(`[GaudiolabClient] Original types: ${JSON.stringify(types)}`);
    console.log(`[GaudiolabClient] API types: ${JSON.stringify(validTypes)}`);
    
    try {
      const response = await this.client.post<GaudiolabJobResponse>(
        '/v1/gsep_music_hq_v1/jobs',
        {
          audioUploadId,
          type: typeString,
        }
      );
      
      console.log(`[GaudiolabClient] Create job response:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      // Enhanced error logging to diagnose API errors
      console.error(`[GaudiolabClient] ❌ Error creating job:`);
      console.error(`[GaudiolabClient] Request URL: /v1/gsep_music_hq_v1/jobs`);
      console.error(`[GaudiolabClient] Request body:`, JSON.stringify({ audioUploadId, type: typeString }, null, 2));
      console.error(`[GaudiolabClient] Full error object:`, JSON.stringify(error.response?.data || error, null, 2));
      console.error(`[GaudiolabClient] Error response data:`, error.response?.data);
      console.error(`[GaudiolabClient] Error message:`, error.message);
      console.error(`[GaudiolabClient] Error status:`, error.response?.status);
      
      // If error mentions "Unsupported type", check if it's specifically about "others"
      const errorMessage = error.response?.data?.resultMessage || error.response?.data?.message || error.message || '';
      const errorData = error.response?.data || {};
      
      console.error(`[GaudiolabClient] Full error response:`, JSON.stringify(errorData, null, 2));
      
      // Try different variations if "others" causes issues
      if (errorMessage.includes('Unsupported') && validTypes.includes('others')) {
        // Try 1: Remove "others" and retry
        console.warn(`[GaudiolabClient] ⚠️ API rejected "others", trying without it`);
        const fallbackTypes = validTypes.filter(t => t !== 'others');
        if (fallbackTypes.length > 0) {
          const fallbackTypeString = fallbackTypes.join(',');
          console.log(`[GaudiolabClient] Retry attempt 1: types=${fallbackTypeString}`);
          try {
            const fallbackResponse = await this.client.post<GaudiolabJobResponse>(
              '/v1/gsep_music_hq_v1/jobs',
              {
                audioUploadId,
                type: fallbackTypeString,
              }
            );
            console.log(`[GaudiolabClient] ✅ Fallback succeeded (without "others")`);
            console.warn(`[GaudiolabClient] ⚠️ Note: "others" was removed from request. API may still return it in results.`);
            return fallbackResponse.data;
          } catch (fallbackError: any) {
            console.error(`[GaudiolabClient] ❌ Fallback also failed:`, fallbackError.response?.data || fallbackError.message);
          }
        }
      }
      
      throw error;
    }
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







