import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-hot-toast';

interface ContentDisplayProps {
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

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  originalText,
  localizedText,
  author,
  timestamp,
  stats
}) => {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已複製到剪貼簿');
    } catch (error) {
      toast.error('複製失敗');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#15202b', color: 'white' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1d9bf0' }}>
          推文預覽
        </Typography>
        <Box sx={{ 
          p: 2, 
          borderRadius: 2,
          border: '1px solid #2f3336',
          bgcolor: '#192734'
        }}>
          {author && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {author.avatar && (
                <Box
                  component="img"
                  src={author.avatar}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%',
                    mr: 1 
                  }}
                  alt={author.name}
                />
              )}
              <Box>
                <Typography sx={{ fontWeight: 'bold' }}>{author.name}</Typography>
                <Typography sx={{ color: '#8899a6' }}>@{author.username}</Typography>
              </Box>
            </Box>
          )}

          <Typography sx={{ my: 2, whiteSpace: 'pre-wrap' }}>
            {originalText}
          </Typography>

          {timestamp && (
            <Typography sx={{ color: '#8899a6', fontSize: '0.9em', mb: 1 }}>
              {new Date(timestamp).toLocaleString()}
            </Typography>
          )}

          {stats && (
            <Box sx={{ 
              display: 'flex', 
              gap: 3,
              color: '#8899a6',
              borderTop: '1px solid #2f3336',
              pt: 2
            }}>
              <Typography>回覆 {stats.replies}</Typography>
              <Typography>轉推 {stats.retweets}</Typography>
              <Typography>喜歡 {stats.likes}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">原始文案</Typography>
          <Tooltip title="複製文案">
            <IconButton onClick={() => handleCopy(originalText)}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{originalText}</Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">台灣在地化版本</Typography>
          <Tooltip title="複製文案">
            <IconButton onClick={() => handleCopy(localizedText)}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{localizedText}</Typography>
      </Paper>
    </Box>
  );
}; 