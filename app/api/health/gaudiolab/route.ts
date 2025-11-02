import { NextResponse } from 'next/server';
import { GaudiolabClient } from '@/lib/gaudiolab/client';

/**
 * 诊断端点：检查 Gaudiolab API 连接和环境配置
 * GET /api/health/gaudiolab
 */
export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasApiKey: !!process.env.GAUDIOLAB_API_KEY,
        apiKeyLength: process.env.GAUDIOLAB_API_KEY?.length || 0,
        apiUrl: process.env.NEXT_PUBLIC_GAUDIOLAB_API_URL || 'https://restapi.gaudiolab.io/developers/api',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelRegion: process.env.VERCEL_REGION,
      },
      client: null as any,
      error: null as any,
    };

    try {
      const client = new GaudiolabClient();
      diagnostics.client = {
        initialized: true,
      };
    } catch (error: any) {
      diagnostics.error = {
        message: error.message,
        name: error.name,
      };
    }

    return NextResponse.json(diagnostics, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

