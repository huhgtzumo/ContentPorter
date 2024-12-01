import { Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

    // 使用臨時檔案路徑
    const tempFilePath = join(tmpdir(), `x-video-${Date.now()}.mp4`);
    
    console.log('開始下載影片...');
    // 使用 yt-dlp 直接下載指定格式
    await execAsync(`yt-dlp -f ${selectedVideo.formatId} "${url}" -o "${tempFilePath}"`);
    
    // 創建讀取流
    const fileStream = createReadStream(tempFilePath);
    
    // 設置清理函數
    fileStream.on('end', () => {
      // 下載完成後刪除臨時檔案
      execAsync(`rm "${tempFilePath}"`);
    });

    return fileStream;
  } catch (error) {
    console.error('下載失敗:', error);
    throw error;
  }
}; 