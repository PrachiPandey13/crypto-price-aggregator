const cron = require('node-cron');
const { fetchAndAggregateTokens } = require('./tokenService');
const { SocketServer } = require('../websocket/socketServer');

class CronService {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.task = null;
  }

  startTokenUpdates() {
    // Schedule task to run every 5 seconds
    this.task = cron.schedule('*/5 * * * * *', async () => {
      try {
        console.log('Fetching fresh token data...');
        
        const freshData = await fetchAndAggregateTokens({
          time: '24h',
          sort: 'volume',
          limit: 50
        });

        // Broadcast to all connected WebSocket clients
        this.socketServer.getIO().emit('tokenUpdates', {
          timestamp: Date.now(),
          data: freshData
        });

        console.log('Token data updated and broadcasted to clients');
      } catch (error) {
        console.error('Error in scheduled token update:', error);
      }
    });

    this.task.start();
    console.log('Cron service started - fetching token data every 5 seconds');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Cron service stopped');
    }
  }
}

module.exports = { CronService }; 