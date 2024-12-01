interface DownloadProgressProps {
  progress: number;
  downloadedSize: number;
  totalSize: number;
  estimatedTime?: number;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({
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
    <div className="download-progress">
      <LinearProgress variant="determinate" value={progress} />
      <div className="progress-info">
        <span>{progress.toFixed(1)}%</span>
        <span>{formatSize(downloadedSize)} / {formatSize(totalSize)}</span>
        {estimatedTime && <span>預估剩餘時間: {estimatedTime}秒</span>}
      </div>
    </div>
  );
}; 