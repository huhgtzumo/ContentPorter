import { Router, Request, Response, RequestHandler } from 'express';
import { downloadVideo, getVideoInfo } from '../services/downloadService';
import { getPostContent } from '../services/textService';
import { exec } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { broadcastProgress } from '../services/websocket';

const router = Router();

interface DownloadRequestBody {
  url: string;
  quality: string;
}

// 實際下載處理
const handleDownload: RequestHandler = async (req: Request<{}, {}, DownloadRequestBody>, res: Response): Promise<void> => {
  try {
    const { url, quality } = req.body;
    console.log('收到下載請求:', url, quality);

    if (!url || !quality) {
      console.log('URL或品質參數為空');
      res.status(400).json({ error: '需要提供URL和品質參數' });
      return;
    }

    // 先獲取視頻信息
    const videoInfo = await getVideoInfo(url);
    const selectedVideo = videoInfo.find(v => v.quality === quality);

    if (!selectedVideo) {
      throw new Error('找不到指定品質的影片');
    }

    // 設置響應頭
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="x-video-${Date.now()}.mp4"`);

    // 使用 formatId 而不是 quality
    const tempFilePath = join(tmpdir(), `x-video-${Date.now()}.mp4`);
    
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
    fileStream.on('end', async () => {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('清理臨時文件失敗:', err);
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('下載失敗:', error);
    res.status(500).json({ error: '下載失敗' });
  }
};

// 其他路由保持不變
router.get('/info', (async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (typeof url !== 'string') {
      return res.status(400).json({ error: '需要提供URL' });
    }
    
    const videoInfo = await getVideoInfo(url);
    res.json(videoInfo);
  } catch (error) {
    res.status(500).json({ error: '獲取視頻信息失敗' });
  }
}) as RequestHandler);

router.get('/content', (async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (typeof url !== 'string') {
      return res.status(400).json({ error: '需要提供URL' });
    }
    
    const content = await getPostContent(url);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: '取得文案失敗' });
  }
}) as RequestHandler);

router.post('/process', handleDownload);

export default router; 