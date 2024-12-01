import { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Box, MenuItem } from '@mui/material';
import { DownloadProgress } from './components/DownloadProgress';
import { Toaster } from 'react-hot-toast';
import { ContentDisplay } from './components/ContentDisplay';

interface VideoQuality {
  url: string;
  quality: string;
  format: string;
}

interface PostContent {
  originalText: string;
  localizedText: string;
  author?: {
    name: string;
    username: string;
    avatar?: string;
  };
  timestamp?: string;
  stats?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

function App() {
  const [url, setUrl] = useState('');
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    progress: 0,
    downloadedSize: 0,
    totalSize: 0
  });
  const [content, setContent] = useState<PostContent | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 建立 WebSocket 連接
    ws.current = new WebSocket(`ws://${window.location.hostname}:5001`);

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Progress update:', data);
        if (data.progress !== undefined) {
          setProgress(data);
        }
      } catch (error) {
        console.error('Progress data parse error:', error);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleGetInfo = async () => {
    try {
      const videoResponse = await fetch(`/api/download/info?url=${encodeURIComponent(url)}`);
      const videoData = await videoResponse.json();
      setQualities(videoData);

      const contentResponse = await fetch(`/api/download/content?url=${encodeURIComponent(url)}`);
      const contentData = await contentResponse.json();
      setContent(contentData);
    } catch (error) {
      console.error('獲取資訊失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !selectedQuality) return;

    setIsProcessing(true);
    
    try {
      // 直接發送下載請求
      const response = await fetch('/api/download/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, quality: selectedQuality })
      });

      if (!response.ok) {
        throw new Error('下載請求失敗');
      }

      // 處理下載
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `x-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

    } catch (error) {
      console.error('下載失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Toaster position="top-right" />
      <Box sx={{ my: 4 }}>
        <h1>X 貼文影片搬運工具</h1>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="輸入 X 貼文網址"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            margin="normal"
            disabled={isProcessing}
          />
          
          <Button
            variant="contained"
            onClick={handleGetInfo}
            disabled={!url || isProcessing}
            sx={{ mt: 2, mr: 2 }}
          >
            取得影片資訊
          </Button>

          {qualities.length > 0 && (
            <>
              <TextField
                select
                fullWidth
                label="選擇影片品質"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                margin="normal"
                disabled={isProcessing}
              >
                {qualities.map((q) => (
                  <MenuItem key={q.quality} value={q.quality}>
                    {q.quality} ({q.format})
                  </MenuItem>
                ))}
              </TextField>
              
              <Button 
                variant="contained" 
                type="submit"
                disabled={isProcessing || !selectedQuality}
                sx={{ mt: 2 }}
              >
                {isProcessing ? '處理中...' : '下載影片'}
              </Button>
            </>
          )}
        </form>

        {isProcessing && (
          <DownloadProgress
            progress={progress.progress}
            downloadedSize={progress.downloadedSize}
            totalSize={progress.totalSize}
          />
        )}

        {content && (
          <ContentDisplay
            originalText={content.originalText}
            localizedText={content.localizedText}
            author={content.author}
            timestamp={content.timestamp}
            stats={content.stats}
          />
        )}
      </Box>
    </Container>
  );
}

export default App;
