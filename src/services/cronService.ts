import * as cron from 'node-cron';
import { fetchAndAggregateTokens } from './tokenService';
import { SocketServer } from '../websocket/socketServer';

export class CronService {
  private socketServer: SocketServer;
  private task: cron.ScheduledTask | null = null;

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer;
  }

  public startTokenUpdates() {
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

  public stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Cron service stopped');
    }
  }
} 