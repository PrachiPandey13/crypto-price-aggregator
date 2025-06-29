// Main entry point for the Real-Time Data Aggregation Service
import { createServer } from 'http';
import app from './app';
import { SocketServer } from './websocket/socketServer';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Initialize WebSocket server
const socketServer = new SocketServer(server);

// Make socket server available to the app for metrics
(app as any).socketServer = socketServer;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 