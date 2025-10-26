import { NextRequest, NextResponse } from 'next/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = new GaudiolabClient();
    const response = await client.createUpload(fileName, fileSize);

    if (response.resultCode !== 1000) {
      throw new Error(response.resultMessage || 'Failed to create upload');
    }

    return NextResponse.json(response.resultData);
  } catch (error: any) {
    console.error('Error creating upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create upload' },
      { status: 500 }
    );
  }
}







