import { NextRequest, NextResponse } from 'next/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';

/**
 * 获取 Gaudiolab job 状态（用于匿名用户）
 * GET /api/jobs/gaudiolab/[jobId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    console.log(`[Job Status API] ========== START ==========`);
    console.log(`[Job Status API] JobId: ${params.jobId}`);
    console.log(`[Job Status API] Request URL: ${request.url}`);
    
    const client = new GaudiolabClient();
    
    // 添加超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gaudiolab API request timeout after 20 seconds')), 20000);
    });
    
    let response;
    try {
      console.log(`[Job Status API] Calling Gaudiolab API...`);
      response = await Promise.race([
        client.getJobStatus(params.jobId),
        timeoutPromise,
      ]) as any;
      console.log(`[Job Status API] ✅ Gaudiolab API call successful`);
    } catch (apiError: any) {
      console.error(`[Job Status API] ❌ Gaudiolab API call failed:`);
      console.error(`[Job Status API] Error name: ${apiError.name}`);
      console.error(`[Job Status API] Error message: ${apiError.message}`);
      console.error(`[Job Status API] Error stack: ${apiError.stack}`);
      
      // 如果是 axios 错误，记录更多信息
      if (apiError.response) {
        console.error(`[Job Status API] Response status: ${apiError.response.status}`);
        console.error(`[Job Status API] Response data:`, JSON.stringify(apiError.response.data, null, 2));
        console.error(`[Job Status API] Response headers:`, JSON.stringify(apiError.response.headers, null, 2));
      }
      if (apiError.request) {
        console.error(`[Job Status API] Request made but no response received`);
        console.error(`[Job Status API] Request config:`, JSON.stringify(apiError.config || {}, null, 2));
      }
      
      // 重新抛出错误，让外层 catch 处理
      throw apiError;
    }

    // 立即记录完整的原始响应
    console.log(`[Job Status API] Full Gaudiolab API Response:`, JSON.stringify(response, null, 2));
    console.log(`[Job Status API] ResultCode: ${response.resultCode}`);
    
    if (response.resultCode !== 1000) {
      console.error(`[Job Status API] API Error - ResultCode: ${response.resultCode}, Message: ${response.resultMessage}`);
      return NextResponse.json(
        { error: response.resultMessage || 'Failed to fetch job status' },
        { status: 400 }
      );
    }

    const jobData = response.resultData;
    
    // 添加日志：查看实际返回的状态值
    console.log(`[Job Status API] Raw status from Gaudiolab: "${jobData.status}" (type: ${typeof jobData.status})`);
    console.log(`[Job Status API] Has downloadUrl:`, !!jobData.downloadUrl);
    if (jobData.downloadUrl) {
      const downloadUrl = jobData.downloadUrl as any; // TypeScript 类型可能不准确，使用 any
      console.log(`[Job Status API] downloadUrl type:`, typeof downloadUrl);
      if (typeof downloadUrl === 'string') {
        console.log(`[Job Status API] downloadUrl length: ${downloadUrl.length}, preview: ${downloadUrl.substring(0, 200)}...`);
      } else {
        console.log(`[Job Status API] downloadUrl keys:`, Object.keys(downloadUrl || {}));
      }
    }

    // 改进的状态映射：处理更多可能的状态值（转换为小写比较）
    let status: 'waiting' | 'running' | 'success' | 'failed';
    const rawStatus = String(jobData.status || '').toLowerCase().trim();
    
    console.log(`[Job Status API] Normalized status: "${rawStatus}"`);
    
    if (rawStatus === 'pending' || rawStatus === 'waiting' || rawStatus === 'queued' || rawStatus === '0') {
      status = 'waiting';
    } else if (rawStatus === 'processing' || rawStatus === 'running' || rawStatus === 'in_progress' || rawStatus === '1' || rawStatus === '2') {
      status = 'running';
    } else if (rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'done' || rawStatus === 'finished' || rawStatus === '3') {
      status = 'success';
    } else if (rawStatus === 'failed' || rawStatus === 'error' || rawStatus === '4') {
      status = 'failed';
    } else {
      // 未知状态，记录警告并尝试根据 downloadUrl 判断
      console.warn(`[Job Status API] Unknown status value: "${jobData.status}", defaulting based on downloadUrl presence`);
      const downloadUrl = jobData.downloadUrl as any;
      if (downloadUrl) {
        // 如果有 downloadUrl，可能是完成了但状态值不对
        console.log(`[Job Status API] Has downloadUrl but unknown status, treating as 'success'`);
        status = 'success';
      } else {
        console.log(`[Job Status API] No downloadUrl and unknown status, treating as 'waiting'`);
        status = 'waiting';
      }
    }
    
    console.log(`[Job Status API] Mapped status: ${status}`);

    // 转换 downloadUrl 对象为 tracks 数组
    const tracks: any[] = [];
    if (jobData.downloadUrl) {
      try {
        let downloadUrlObj: any;
        const downloadUrl = jobData.downloadUrl as any; // TypeScript 类型可能不准确，使用 any
        
        // 如果是字符串，先解析成对象
        if (typeof downloadUrl === 'string') {
          console.log(`[Job Status API] Parsing downloadUrl from string...`);
          downloadUrlObj = JSON.parse(downloadUrl);
          console.log(`[Job Status API] Parsed successfully, keys:`, Object.keys(downloadUrlObj));
        } else {
          downloadUrlObj = downloadUrl;
          console.log(`[Job Status API] downloadUrl is already object, keys:`, Object.keys(downloadUrlObj));
        }
        
        // 遍历每个音轨类型
        Object.entries(downloadUrlObj).forEach(([trackType, urls]: [string, any]) => {
          console.log(`[Job Status API] Processing track: ${trackType}, urls type:`, typeof urls, urls);
          if (urls && typeof urls === 'object' && (urls.mp3 || urls.wav)) {
            tracks.push({
              id: `${jobData.jobId}_${trackType}`,
              track_type: trackType,
              download_url: urls.mp3 || urls.wav,
              preview_url: urls.mp3 || urls.wav,
              mp3_url: urls.mp3,
              wav_url: urls.wav,
            });
            console.log(`[Job Status API] ✅ Added track: ${trackType}`);
          } else {
            console.warn(`[Job Status API] ⚠️ Track ${trackType} has invalid format:`, urls);
          }
        });
        
        console.log(`[Job Status API] Total tracks parsed: ${tracks.length}`);
      } catch (error: any) {
        console.error('❌ Error parsing downloadUrl:', error);
        console.error('❌ Raw downloadUrl value:', jobData.downloadUrl);
        // 尝试将错误信息也包含在响应中，以便前端能看到
      }
    } else {
      console.log(`[Job Status API] No downloadUrl in response, status: ${status}`);
    }

    // 计算进度
    const progress = status === 'success' ? 100 : (status === 'running' ? 50 : 0);

    console.log(`[Job Status API] ========== SUMMARY ==========`);
    console.log(`[Job Status API] Final status: ${status}`);
    console.log(`[Job Status API] Final tracks count: ${tracks.length}`);
    console.log(`[Job Status API] Final progress: ${progress}`);
    console.log(`[Job Status API] ========== END ==========`);

    return NextResponse.json({
      status,
      tracks,
      progress,
    });
  } catch (error: any) {
    console.error(`[Job Status API] ========== ERROR ==========`);
    console.error(`[Job Status API] Error type: ${typeof error}`);
    console.error(`[Job Status API] Error name: ${error.name}`);
    console.error(`[Job Status API] Error message: ${error.message}`);
    console.error(`[Job Status API] Error stack: ${error.stack}`);
    
    // 如果是 axios 错误，记录详细信息
    if (error.isAxiosError) {
      console.error(`[Job Status API] This is an Axios error`);
      if (error.response) {
        console.error(`[Job Status API] Response status: ${error.response.status}`);
        console.error(`[Job Status API] Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.request) {
        console.error(`[Job Status API] No response received from Gaudiolab API`);
        console.error(`[Job Status API] Request URL: ${error.config?.url}`);
        console.error(`[Job Status API] Request method: ${error.config?.method}`);
      }
    }
    
    // 确定错误状态码
    let statusCode = 500;
    let errorMessage = error.message || 'Failed to fetch job status';
    
    if (error.message?.includes('timeout')) {
      statusCode = 504; // Gateway Timeout
      errorMessage = 'Request to Gaudiolab API timed out. Please try again.';
    } else if (error.response?.status) {
      statusCode = error.response.status;
    }
    
    console.error(`[Job Status API] Returning error response: ${statusCode} - ${errorMessage}`);
    console.error(`[Job Status API] ========== END ERROR ==========`);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        status: 'error', // 添加 status 字段，让前端知道这是错误状态
      },
      { status: statusCode }
    );
  }
}

