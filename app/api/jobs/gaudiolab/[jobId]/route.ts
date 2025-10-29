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
    if (jobData.status === 'pending') {
      status = 'waiting';
    } else if (jobData.status === 'processing') {
      status = 'running';
    } else if (jobData.status === 'success' || jobData.status === 'completed') {
      status = 'success';
    } else {
      status = 'failed';
    }

    // 转换 tracks 数据
    const tracks = jobData.resultFileList?.map((file: any) => ({
      id: file.fileId || Math.random().toString(),
      track_type: file.type || 'unknown',
      download_url: file.downloadUrl,
      preview_url: file.downloadUrl, // Gaudiolab 可能没有单独的预览 URL
    })) || [];

    return NextResponse.json({
      status,
      tracks,
      progress: jobData.progress || 0,
    });
  } catch (error: any) {
    console.error('Error fetching Gaudiolab job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

