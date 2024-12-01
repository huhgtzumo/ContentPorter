import { Box, LinearProgress, Typography } from '@mui/material';

interface DownloadProgressProps {
  progress: number;
  downloadedSize: number;
  totalSize: number;
  estimatedTime?: number;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  downloadedSize,
  totalSize,
  estimatedTime
}) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <LinearProgress variant="determinate" value={progress} />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {progress.toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatSize(downloadedSize)} / {formatSize(totalSize)}
        </Typography>
        {estimatedTime && (
          <Typography variant="body2" color="text.secondary">
            預估剩餘時間: {estimatedTime}秒
          </Typography>
        )}
      </Box>
    </Box>
  );
}; 