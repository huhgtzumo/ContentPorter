import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import downloadRouter from './routes/download';
import { downloadLimiter } from './middleware/rateLimit';
import { initWebSocket } from './services/websocket';

const app = express();
const server = createServer(app);

// 初始化 WebSocket
initWebSocket(server);

app.use(cors());
app.use(express.json());

// 添加限流中間件
app.use('/api/download', downloadLimiter);
app.use('/api/download', downloadRouter);

// 基本的健康檢查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
}); 