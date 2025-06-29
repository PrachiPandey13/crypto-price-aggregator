// Main entry point for the Real-Time Data Aggregation Service
const { createServer } = require('http');
const app = require('./app');
const { SocketServer } = require('./websocket/socketServer');

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Initialize WebSocket server
const socketServer = new SocketServer(server);

// Make socket server available to the app for metrics
app.socketServer = socketServer;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 