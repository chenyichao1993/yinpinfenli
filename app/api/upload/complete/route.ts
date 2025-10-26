import { NextRequest, NextResponse } from 'next/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, parts } = body;

    if (!uploadId || !parts) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = new GaudiolabClient();
    const response = await client.completeUpload(uploadId, parts);

    if (response.resultCode !== 1000) {
      throw new Error(response.resultMessage || 'Failed to complete upload');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete upload' },
      { status: 500 }
    );
  }
}







