"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordApiResponseTime = recordApiResponseTime;
exports.recordCacheHit = recordCacheHit;
exports.recordCacheMiss = recordCacheMiss;
exports.getMetrics = getMetrics;
exports.getMetricsEndpoint = getMetricsEndpoint;
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
function getMetricsEndpoint(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get socket server instance (you'll need to pass this from your main app)
            const socketServer = req.app.socketServer;
            const metrics = getMetrics(socketServer);
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to fetch metrics',
                details: error.message
            });
        }
    });
}
