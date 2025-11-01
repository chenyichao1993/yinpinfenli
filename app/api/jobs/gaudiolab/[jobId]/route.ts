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
    const client = new GaudiolabClient();
    const response = await client.getJobStatus(params.jobId);

    // 添加详细日志
    console.log(`[Job Status API] JobId: ${params.jobId}`);
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
      console.log(`[Job Status API] downloadUrl type:`, typeof jobData.downloadUrl);
      if (typeof jobData.downloadUrl === 'string') {
        console.log(`[Job Status API] downloadUrl length: ${jobData.downloadUrl.length}, preview: ${jobData.downloadUrl.substring(0, 200)}...`);
      } else {
        console.log(`[Job Status API] downloadUrl keys:`, Object.keys(jobData.downloadUrl || {}));
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
      if (jobData.downloadUrl) {
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
        
        // 如果是字符串，先解析成对象
        if (typeof jobData.downloadUrl === 'string') {
          console.log(`[Job Status API] Parsing downloadUrl from string...`);
          downloadUrlObj = JSON.parse(jobData.downloadUrl);
          console.log(`[Job Status API] Parsed successfully, keys:`, Object.keys(downloadUrlObj));
        } else {
          downloadUrlObj = jobData.downloadUrl;
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
      }
    } else {
      console.log(`[Job Status API] No downloadUrl in response, status: ${status}`);
    }

    // 计算进度
    const progress = status === 'success' ? 100 : (status === 'running' ? 50 : 0);

    console.log(`[Job Status API] Returning: status=${status}, tracks=${tracks.length}, progress=${progress}`);

    return NextResponse.json({
      status,
      tracks,
      progress,
    });
  } catch (error: any) {
    console.error('Error fetching Gaudiolab job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

