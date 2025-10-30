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

    if (response.resultCode !== 1000) {
      return NextResponse.json(
        { error: response.resultMessage || 'Failed to fetch job status' },
        { status: 400 }
      );
    }

    const jobData = response.resultData;

    // 映射 Gaudiolab 状态到我们的状态
    let status: 'waiting' | 'running' | 'success' | 'failed';
    if (jobData.status === 'pending' || jobData.status === 'waiting') {
      status = 'waiting';
    } else if (jobData.status === 'processing' || jobData.status === 'running') {
      status = 'running';
    } else if (jobData.status === 'success' || jobData.status === 'completed') {
      status = 'success';
    } else {
      status = 'failed';
    }

    // 转换 downloadUrl 对象为 tracks 数组
    // Gaudiolab API 返回格式: { downloadUrl: { vocals: { mp3: "url", wav: "url" }, drums: {...}, ... } }
    const tracks: any[] = [];
    if (jobData.downloadUrl && typeof jobData.downloadUrl === 'object') {
      Object.entries(jobData.downloadUrl).forEach(([trackType, urls]: [string, any]) => {
        if (urls && (urls.mp3 || urls.wav)) {
          tracks.push({
            id: `${jobData.jobId}_${trackType}`,
            track_type: trackType,
            download_url: urls.mp3 || urls.wav, // 优先使用 mp3
            preview_url: urls.mp3 || urls.wav,
            mp3_url: urls.mp3,
            wav_url: urls.wav,
          });
        }
      });
    }

    // 计算进度
    const progress = status === 'success' ? 100 : (status === 'running' ? 50 : 0);

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

