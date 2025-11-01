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
    // According to official API docs (https://www.gaudiolab.com/docs/developers/guide/api_references/stem-separation/gsep_music_hq_v1/job):
    // The 'type' parameter only accepts: 'vocal', 'drum', 'bass', 'electric_guitar', 'acoustic_piano'
    // Note: 'others' is NOT a valid request parameter, but the model may return it in results
    const supportedApiTypes = ['vocal', 'drum', 'bass', 'electric_guitar', 'acoustic_piano'];
    
    // Check if user selected "others"
    const hadOthers = types.includes('others');
    
    // Strategy: If user selected "others", we need to request ALL supported types
    // so that API returns all tracks (including "others" if available), then frontend filters
    // Otherwise, send only the types user selected
    let validTypes: string[];
    
    if (hadOthers) {
      // User selected "others" - request all types so API returns everything (including "others")
      validTypes = supportedApiTypes;
      console.log(`[GaudiolabClient] User selected "others" - requesting all supported types to get complete results (frontend will filter)`);
    } else {
      // User did not select "others" - send only selected types
      validTypes = types
        .map(t => t === 'vocals' ? 'vocal' : t) // Convert "vocals" to "vocal"
        .filter(t => supportedApiTypes.includes(t)); // Only keep supported types
      
      // If no valid types after filtering, use all supported types as fallback
      if (validTypes.length === 0) {
        validTypes = supportedApiTypes;
        console.warn(`[GaudiolabClient] No valid types selected, using all supported types as fallback`);
      }
    }
    
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
      
      // Log detailed error information for debugging
      const errorMessage = error.response?.data?.resultMessage || error.response?.data?.message || error.message || '';
      const errorData = error.response?.data || {};
      
      console.error(`[GaudiolabClient] Full error response:`, JSON.stringify(errorData, null, 2));
      
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







