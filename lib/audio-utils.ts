/**
 * 音频文件处理工具
 */

/**
 * 获取音频文件的时长（秒）
 * @param file 音频文件
 * @returns 音频时长（秒）
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata. Please ensure it\'s a valid audio file.'));
    };
    
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * 格式化时长（秒 → MM:SS）
 * @param seconds 秒数
 * @returns 格式化的时长字符串
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 验证音频文件格式
 * @param filename 文件名
 * @returns 是否为有效的音频格式
 */
export function isValidAudioFormat(filename: string): boolean {
  const validExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.mp4', '.aac', '.ogg'];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return validExtensions.includes(ext);
}

/**
 * 验证文件大小
 * @param sizeInBytes 文件大小（字节）
 * @param maxSizeInBytes 最大文件大小（字节）
 * @returns 是否在限制内
 */
export function validateFileSize(sizeInBytes: number, maxSizeInBytes: number): boolean {
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

