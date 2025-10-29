/**
 * 浏览器指纹生成工具
 * 用于追踪匿名用户
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * 获取浏览器指纹
 * @returns 唯一的浏览器指纹字符串
 */
export async function getBrowserFingerprint(): Promise<string> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error generating browser fingerprint:', error);
    // 降级方案：使用基础的浏览器信息
    return generateFallbackFingerprint();
  }
}

/**
 * 降级指纹生成（当 FingerprintJS 失败时）
 */
function generateFallbackFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  
  const data = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return 'fallback_' + Math.abs(hash).toString(36);
}

