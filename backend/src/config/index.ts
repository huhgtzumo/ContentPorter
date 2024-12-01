import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  download: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000')
  }
}; 