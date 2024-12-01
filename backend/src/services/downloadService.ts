import { Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { broadcastProgress } from './websocket';

const execAsync = promisify(exec);

interface VideoQuality {
  url: string;
  quality: string;
  format: string;
  formatId: string;
  filesize?: number;
}

// 獲取影片資訊
export const getVideoInfo = async (url: string): Promise<VideoQuality[]> => {
  try {
    console.log('開始解析 X 貼文:', url);
    const { stdout, stderr } = await execAsync(`yt-dlp -j "${url}"`);
    
    if (stderr.includes('NSFW tweet requires authentication')) {
      throw new Error('此貼文為隱私內容，需要登入才能存取');
    }
    
    const info = JSON.parse(stdout);
    
    // 過濾並整理影片格式
    const formats = info.formats
      .filter((format: any) => format.height) // 只保留有高度資訊的格式
      .reduce((acc: VideoQuality[], format: any) => {
        // 檢查是否已經有相同品質的格式
        const existingQuality = acc.find(f => f.quality === `${format.height}p`);
        if (!existingQuality || (format.filesize || 0) > (existingQuality.filesize || 0)) {
          return [
            ...acc.filter(f => f.quality !== `${format.height}p`),
            {
              url: format.url,
              quality: `${format.height}p`,
              format: format.ext,
              formatId: format.format_id,
              filesize: format.filesize || 0
            }
          ];
        }
        return acc;
      }, [])
      .sort((a: VideoQuality, b: VideoQuality) => {
        const aHeight = parseInt(a.quality);
        const bHeight = parseInt(b.quality);
        return bHeight - aHeight;
      });

    return formats;
  } catch (error: any) {
    if (error.message.includes('NSFW tweet requires authentication')) {
      throw new Error('此貼文為隱私內容，需要登入才能存取');
    } else if (error.stderr?.includes('Video unavailable')) {
      throw new Error('找不到影片內容，可能是私密貼文或已被刪除');
    }
    console.error('取得影片資訊失敗:', error);
    throw error;
  }
};

// 下載指定品質的影片
export const downloadVideo = async (url: string, quality: string, res: Response) => {
  try {
    const videoInfo = await getVideoInfo(url);
    const selectedVideo = videoInfo.find(v => v.quality === quality);
    
    if (!selectedVideo) {
      throw new Error('找不到指定品質的影片');
    }

    const tempFilePath = join(tmpdir(), `x-video-${Date.now()}.mp4`);
    console.log('開始下載影片...');

    // 使用 yt-dlp 下載，並監聽進度
    await new Promise((resolve, reject) => {
      const process = exec(
        `yt-dlp -f ${selectedVideo.formatId} "${url}" -o "${tempFilePath}" --newline`,
        { maxBuffer: 1024 * 1024 * 100 }
      );

      process.stdout?.on('data', (data: string) => {
        const downloadMatch = data.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*)([KMG])iB/);
        if (downloadMatch) {
          const [, percent, size, unit] = downloadMatch;
          const multiplier = unit === 'G' ? 1024 * 1024 * 1024 : unit === 'M' ? 1024 * 1024 : 1024;
          const totalBytes = parseFloat(size) * multiplier;
          const downloadedBytes = totalBytes * (parseFloat(percent) / 100);

          const progress = {
            progress: parseFloat(percent),
            downloadedSize: Math.floor(downloadedBytes),
            totalSize: Math.floor(totalBytes)
          };

          console.log('下載進度:', progress);
          broadcastProgress(progress);
        }
      });

      process.on('exit', (code) => {
        if (code === 0) resolve(null);
        else reject(new Error(`下載失敗，退出碼: ${code}`));
      });
    });

    // 返回文件流
    const fileStream = createReadStream(tempFilePath);
    fileStream.on('end', () => {
      // 清理臨時文件
      execAsync(`rm "${tempFilePath}"`);
    });

    return fileStream;
  } catch (error) {
    console.error('下載失敗:', error);
    throw error;
  }
}; 