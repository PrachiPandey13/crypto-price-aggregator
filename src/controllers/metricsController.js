// Global metrics storage
const metrics = {
  apiResponseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
  totalApiCalls: 0
};

function recordApiResponseTime(responseTime) {
  metrics.apiResponseTimes.push(responseTime);
  // Keep only last 100 response times to avoid memory issues
  if (metrics.apiResponseTimes.length > 100) {
    metrics.apiResponseTimes.shift();
  }
}

function recordCacheHit() {
  metrics.cacheHits++;
  metrics.totalApiCalls++;
}

function recordCacheMiss() {
  metrics.cacheMisses++;
  metrics.totalApiCalls++;
}

function getMetrics(socketServer) {
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

async function getMetricsEndpoint(req, res) {
  try {
    // Get socket server instance (you'll need to pass this from your main app)
    const socketServer = req.app.socketServer;
    const metrics = getMetrics(socketServer);
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch metrics', 
      details: error.message 
    });
  }
}

module.exports = {
  recordApiResponseTime,
  recordCacheHit,
  recordCacheMiss,
  getMetrics,
  getMetricsEndpoint
}; 