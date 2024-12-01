import axios from 'axios';
import { Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VideoQuality {
  url: string;
  quality: string;
  format: string;
}

// 獲取視頻信息
export const getVideoInfo = async (url: string): Promise<VideoQuality[]> => {
  try {
    // 使用 yt-dlp 獲取所有可用格式
    const { stdout } = await execAsync(`yt-dlp -j "${url}"`);
    const info = JSON.parse(stdout);
    
    // 解析不同質量的視頻
    return info.formats.map((format: any) => ({
      url: format.url,
      quality: format.height ? `${format.height}p` : 'unknown',
      format: format.ext
    }));
  } catch (error) {
    console.error('獲取視頻信息失敗:', error);
    throw error;
  }
};

// 下載指定質量的視頻
export const downloadVideo = async (url: string, quality: string, res: Response) => {
  try {
    const videoInfo = await getVideoInfo(url);
    const selectedVideo = videoInfo.find(v => v.quality === quality);
    
    if (!selectedVideo) {
      throw new Error('找不到指定質量的視頻');
    }

    // 下載視頻流
    const videoResponse = await axios({
      url: selectedVideo.url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const total = progressEvent.total || 0;
        console.log('下載進度:', progressEvent.loaded, '/', total);
        const progress = {
          progress: total ? (progressEvent.loaded / total) * 100 : 0,
          downloadedSize: progressEvent.loaded,
          totalSize: total,
        };
        
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    });

    return videoResponse.data;
  } catch (error) {
    console.error('下載失敗:', error);
    throw error;
  }
}; 