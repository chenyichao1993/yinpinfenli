import { NextRequest, NextResponse } from 'next/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, parts } = body;

    console.log(`[Upload Complete API] ========== START ==========`);
    console.log(`[Upload Complete API] UploadId: ${uploadId}`);
    console.log(`[Upload Complete API] Parts count: ${parts?.length || 0}`);

    if (!uploadId || !parts) {
      console.error(`[Upload Complete API] Missing required fields: uploadId=${!!uploadId}, parts=${!!parts}`);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = new GaudiolabClient();
    const response = await client.completeUpload(uploadId, parts);

    console.log(`[Upload Complete API] Complete upload response:`, JSON.stringify(response, null, 2));
    console.log(`[Upload Complete API] ResultCode: ${response.resultCode}`);

    if (response.resultCode !== 1000) {
      console.error(`[Upload Complete API] Failed to complete upload: ${response.resultMessage}`);
      throw new Error(response.resultMessage || 'Failed to complete upload');
    }

    console.log(`[Upload Complete API] ✅ Upload completed successfully`);
    console.log(`[Upload Complete API] ========== END ==========`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete upload' },
      { status: 500 }
    );
  }
}







