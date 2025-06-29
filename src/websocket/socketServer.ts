import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { fetchAndAggregateTokens } from '../services/tokenService';
import { getTokenCache } from '../cache/redisClient';
import { subscriptionManager } from './subscriptionManager';

interface ClientInfo {
  lastPong: number;
  isAlive: boolean;
}

export class SocketServer {
  private io: SocketIOServer;
  private updateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastTokenData: any = null;
  private clientHeartbeats = new Map<string, ClientInfo>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 35000, // 35 seconds timeout
      pingInterval: 30000  // 30 seconds ping interval
    });

    this.setupEventHandlers();
    this.startLiveUpdates();
    this.startHeartbeat();
  }

  private logActiveClients() {
    const clientCount = this.io.engine.clientsCount;
    console.log(`Active WebSocket clients: ${clientCount}`);
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.logActiveClients();

      // Initialize client heartbeat tracking
      this.clientHeartbeats.set(socket.id, {
        lastPong: Date.now(),
        isAlive: true
      });

      // Default subscription for all clients
      subscriptionManager.subscribe(socket.id, {
        time: '24h',
        sort: 'volume',
        limit: 50
      });

      // Push initial token data on connection
      try {
        // First try to get cached data for immediate response
        const cacheKey = 'tokens:24h:volume:50:';
        const cached = await getTokenCache(cacheKey);
        
        if (cached && this.lastTokenData) {
          // Send cached data immediately for faster response
          socket.emit('initialTokens', this.lastTokenData);
          console.log(`Sent cached data to client: ${socket.id}`);
        } else {
          // Fetch fresh data if no cache available
          const initialData = await fetchAndAggregateTokens({
            time: '24h',
            sort: 'volume',
            limit: 50
          });
          this.lastTokenData = initialData;
          socket.emit('initialTokens', initialData);
          console.log(`Sent fresh data to client: ${socket.id}`);
        }
      } catch (error) {
        console.error(`Error fetching initial tokens for client ${socket.id}:`, error);
        socket.emit('error', { message: 'Failed to fetch initial data' });
      }

      // Handle pong responses
      socket.on('pong', () => {
        const clientInfo = this.clientHeartbeats.get(socket.id);
        if (clientInfo) {
          clientInfo.lastPong = Date.now();
          clientInfo.isAlive = true;
          console.log(`Received pong from client: ${socket.id}`);
        }
      });

      // Handle subscription updates
      socket.on('subscribe', (filters: any) => {
        subscriptionManager.subscribe(socket.id, filters);
        socket.emit('subscriptionConfirmed', { filters });
      });

      // Handle specific token subscriptions
      socket.on('subscribeToTokens', (tokenAddresses: string[]) => {
        const currentSubscription = subscriptionManager.getSubscription(socket.id);
        const updatedFilters = {
          ...currentSubscription?.filters,
          tokens: tokenAddresses
        };
        subscriptionManager.subscribe(socket.id, updatedFilters);
        socket.emit('tokenSubscriptionConfirmed', { tokens: tokenAddresses });
      });

      // Handle filter updates
      socket.on('updateFilters', (filters: any) => {
        const currentSubscription = subscriptionManager.getSubscription(socket.id);
        const updatedFilters = {
          ...currentSubscription?.filters,
          ...filters
        };
        subscriptionManager.subscribe(socket.id, updatedFilters);
        socket.emit('filtersUpdated', { filters: updatedFilters });
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        subscriptionManager.unsubscribe(socket.id);
        this.clientHeartbeats.delete(socket.id);
        this.logActiveClients();
      });
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = 35000; // 35 seconds

      // Check all clients for responsiveness
      for (const [socketId, clientInfo] of this.clientHeartbeats) {
        const timeSinceLastPong = now - clientInfo.lastPong;
        
        if (timeSinceLastPong > timeoutThreshold) {
          console.log(`Disconnecting unresponsive client: ${socketId} (no pong for ${timeSinceLastPong}ms)`);
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
          this.clientHeartbeats.delete(socketId);
          subscriptionManager.unsubscribe(socketId);
        } else {
          // Send ping to responsive clients
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('ping');
            console.log(`Sent ping to client: ${socketId}`);
          }
        }
      }

      console.log(`Heartbeat check completed. Active clients: ${this.clientHeartbeats.size}`);
    }, 30000); // Check every 30 seconds
  }

  private startLiveUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        const updatedData = await fetchAndAggregateTokens({
          time: '24h',
          sort: 'volume',
          limit: 50
        });

        // Store the latest data for reconnecting clients
        this.lastTokenData = updatedData;

        // Get subscribers for this update
        const subscribers = subscriptionManager.getSubscribersForFilters({
          time: '24h',
          sort: 'volume',
          limit: 50
        });

        // Send targeted updates to subscribed clients
        subscribers.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('tokenUpdates', {
              timestamp: Date.now(),
              data: updatedData
            });
          }
        });

        // Send specific token updates
        if (updatedData.tokens) {
          updatedData.tokens.forEach((token: any) => {
            const tokenSubscribers = subscriptionManager.getSubscribersForToken(token.address);
            tokenSubscribers.forEach(socketId => {
              const socket = this.io.sockets.sockets.get(socketId);
              if (socket) {
                socket.emit('tokenUpdate', {
                  timestamp: Date.now(),
                  token: token
                });
              }
            });
          });
        }

        console.log(`Sent updates to ${subscribers.length} subscribed clients`);
      } catch (error) {
        console.error('Error in live updates:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public getIO() {
    return this.io;
  }

  public getSubscriptionStats() {
    return {
      totalSubscribers: subscriptionManager.getSubscriptionCount(),
      activeClients: this.io.engine.clientsCount,
      responsiveClients: this.clientHeartbeats.size
    };
  }

  public getHeartbeatStats() {
    const now = Date.now();
    const stats = {
      totalClients: this.clientHeartbeats.size,
      responsiveClients: 0,
      unresponsiveClients: 0,
      averageResponseTime: 0
    };

    let totalResponseTime = 0;
    let responsiveCount = 0;

    for (const [socketId, clientInfo] of this.clientHeartbeats) {
      const timeSinceLastPong = now - clientInfo.lastPong;
      if (timeSinceLastPong < 35000) {
        stats.responsiveClients++;
        totalResponseTime += timeSinceLastPong;
        responsiveCount++;
      } else {
        stats.unresponsiveClients++;
      }
    }

    if (responsiveCount > 0) {
      stats.averageResponseTime = totalResponseTime / responsiveCount;
    }

    return stats;
  }
} 