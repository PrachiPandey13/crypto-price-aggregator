import { Request, Response } from 'express';
import { SocketServer } from '../websocket/socketServer';

// Global metrics storage
interface MetricsData {
  apiResponseTimes: number[];
  cacheHits: number;
  cacheMisses: number;
  totalApiCalls: number;
}

const metrics: MetricsData = {
  apiResponseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
  totalApiCalls: 0
};

export function recordApiResponseTime(responseTime: number) {
  metrics.apiResponseTimes.push(responseTime);
  // Keep only last 100 response times to avoid memory issues
  if (metrics.apiResponseTimes.length > 100) {
    metrics.apiResponseTimes.shift();
  }
}

export function recordCacheHit() {
  metrics.cacheHits++;
  metrics.totalApiCalls++;
}

export function recordCacheMiss() {
  metrics.cacheMisses++;
  metrics.totalApiCalls++;
}

export function getMetrics(socketServer?: SocketServer) {
  const averageResponseTime = metrics.apiResponseTimes.length > 0
    ? metrics.apiResponseTimes.reduce((sum, time) => sum + time, 0) / metrics.apiResponseTimes.length
    : 0;

  const cacheHitRate = metrics.totalApiCalls > 0
    ? (metrics.cacheHits / metrics.totalApiCalls) * 100
    : 0;

  const websocketStats = socketServer ? socketServer.getSubscriptionStats() : {
    totalSubscribers: 0,
    activeClients: 0,
    responsiveClients: 0
  };

  const heartbeatStats = socketServer ? socketServer.getHeartbeatStats() : {
    totalClients: 0,
    responsiveClients: 0,
    unresponsiveClients: 0,
    averageResponseTime: 0
  };

  return {
    api: {
      averageResponseTime: Math.round(averageResponseTime),
      totalRequests: metrics.totalApiCalls,
      recentResponseTimes: metrics.apiResponseTimes.slice(-10) // Last 10 response times
    },
    cache: {
      hitRate: Math.round(cacheHitRate * 100) / 100, // Round to 2 decimal places
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      totalRequests: metrics.totalApiCalls
    },
    websocket: {
      connectedClients: websocketStats.activeClients,
      responsiveClients: websocketStats.responsiveClients,
      totalSubscriptions: websocketStats.totalSubscribers,
      heartbeatStats: {
        totalClients: heartbeatStats.totalClients,
        responsiveClients: heartbeatStats.responsiveClients,
        unresponsiveClients: heartbeatStats.unresponsiveClients,
        averageResponseTime: Math.round(heartbeatStats.averageResponseTime)
      }
    },
    timestamp: new Date().toISOString()
  };
}

export async function getMetricsEndpoint(req: Request, res: Response) {
  try {
    // Get socket server instance (you'll need to pass this from your main app)
    const socketServer = (req.app as any).socketServer;
    const metrics = getMetrics(socketServer);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch metrics', 
      details: (error as Error).message 
    });
  }
} 