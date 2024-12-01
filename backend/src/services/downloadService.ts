import axios from 'axios';
import { Response } from 'express';

export const downloadVideo = async (url: string, res: Response) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const progress = {
          progress: (progressEvent.loaded / progressEvent.total) * 100,
          downloadedSize: progressEvent.loaded,
          totalSize: progressEvent.total,
          estimatedTime: calculateEstimatedTime(progressEvent)
        };
        
        // 發送進度更新
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    });

    return response.data;
  } catch (error) {
    throw new Error('下載失敗');
  }
}; 