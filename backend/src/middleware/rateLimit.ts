import rateLimit from 'express-rate-limit';

export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小時
  max: process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 100,
  message: '請求太頻繁，請稍後再試'
}); 