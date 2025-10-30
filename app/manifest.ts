import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stem Splitter - AI Audio Separation',
    short_name: 'Stem Splitter',
    description: 'Professional audio stem separation powered by AI. Isolate vocals, drums, bass, guitar, and piano from any audio track.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#10b981',
    // NOTE: 临时移除 icons，避免在缺少资源时产生 404。
    // 提供以下文件后再恢复：
    // public/icon-192.png (192x192 PNG)
    // public/icon-512.png (512x512 PNG)
  };
}







