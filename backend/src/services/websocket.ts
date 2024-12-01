import WebSocket from 'ws';
import { Server } from 'http';

interface ProgressData {
  progress: number;
  downloadedSize: number;
  totalSize: number;
}

let wss: WebSocket.Server;

export const initWebSocket = (server: Server) => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

export const broadcastProgress = (data: ProgressData) => {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}; 