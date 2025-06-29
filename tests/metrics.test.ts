import request from 'supertest';
import { createServer } from 'http';
import app from '../src/app';
import { SocketServer } from '../src/websocket/socketServer';
import { recordApiResponseTime, recordCacheHit, recordCacheMiss, getMetrics } from '../src/controllers/metricsController';

const server = createServer(app);
const socketServer = new SocketServer(server);
(app as any).socketServer = socketServer;

describe('GET /api/metrics', () => {
  beforeEach(() => {
    // Reset metrics before each test
    recordCacheHit();
    recordCacheMiss();
    recordApiResponseTime(100);
    recordApiResponseTime(200);
    recordApiResponseTime(300);
  });

  it('should return metrics with all required fields', async () => {
    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    expect(response.body).toHaveProperty('api');
    expect(response.body).toHaveProperty('cache');
    expect(response.body).toHaveProperty('websocket');
    expect(response.body).toHaveProperty('timestamp');

    // Check API metrics
    expect(response.body.api).toHaveProperty('averageResponseTime');
    expect(response.body.api).toHaveProperty('totalRequests');
    expect(response.body.api).toHaveProperty('recentResponseTimes');
    expect(typeof response.body.api.averageResponseTime).toBe('number');
    expect(Array.isArray(response.body.api.recentResponseTimes)).toBe(true);

    // Check cache metrics
    expect(response.body.cache).toHaveProperty('hitRate');
    expect(response.body.cache).toHaveProperty('hits');
    expect(response.body.cache).toHaveProperty('misses');
    expect(response.body.cache).toHaveProperty('totalRequests');
    expect(typeof response.body.cache.hitRate).toBe('number');
    expect(response.body.cache.hitRate).toBeGreaterThanOrEqual(0);
    expect(response.body.cache.hitRate).toBeLessThanOrEqual(100);

    // Check WebSocket metrics
    expect(response.body.websocket).toHaveProperty('connectedClients');
    expect(response.body.websocket).toHaveProperty('responsiveClients');
    expect(response.body.websocket).toHaveProperty('totalSubscriptions');
    expect(response.body.websocket).toHaveProperty('heartbeatStats');
    expect(typeof response.body.websocket.connectedClients).toBe('number');
    expect(typeof response.body.websocket.responsiveClients).toBe('number');
    expect(typeof response.body.websocket.totalSubscriptions).toBe('number');

    // Check heartbeat stats
    expect(response.body.websocket.heartbeatStats).toHaveProperty('totalClients');
    expect(response.body.websocket.heartbeatStats).toHaveProperty('responsiveClients');
    expect(response.body.websocket.heartbeatStats).toHaveProperty('unresponsiveClients');
    expect(response.body.websocket.heartbeatStats).toHaveProperty('averageResponseTime');
  });

  it('should calculate average response time correctly', async () => {
    // Add some test response times
    recordApiResponseTime(100);
    recordApiResponseTime(200);
    recordApiResponseTime(300);

    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    // Average should be (100+200+300)/3 = 200
    expect(response.body.api.averageResponseTime).toBe(200);
  });

  it('should calculate cache hit rate correctly', async () => {
    // Reset by adding some hits and misses
    recordCacheHit();
    recordCacheHit();
    recordCacheMiss();

    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    // Hit rate should be 2/(2+1) = 66.67%
    expect(response.body.cache.hitRate).toBe(66.67);
    expect(response.body.cache.hits).toBe(2);
    expect(response.body.cache.misses).toBe(1);
    expect(response.body.cache.totalRequests).toBe(3);
  });

  it('should return zero metrics when no data is available', async () => {
    // Clear all metrics
    const metrics = getMetrics();
    
    expect(metrics.api.averageResponseTime).toBe(0);
    expect(metrics.cache.hitRate).toBe(0);
    expect(metrics.websocket.connectedClients).toBe(0);
  });

  it('should limit response times array to prevent memory issues', async () => {
    // Add more than 100 response times
    for (let i = 0; i < 110; i++) {
      recordApiResponseTime(i);
    }

    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    // Should only keep the last 100
    expect(response.body.api.recentResponseTimes.length).toBeLessThanOrEqual(10);
  });

  it('should handle WebSocket server not available gracefully', async () => {
    const metrics = getMetrics(undefined);
    
    expect(metrics.websocket.connectedClients).toBe(0);
    expect(metrics.websocket.responsiveClients).toBe(0);
    expect(metrics.websocket.totalSubscriptions).toBe(0);
  });

  it('should return valid timestamp', async () => {
    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should handle errors gracefully', async () => {
    // Mock an error scenario by temporarily breaking the metrics function
    const originalGetMetrics = getMetrics;
    (global as any).getMetrics = () => {
      throw new Error('Test error');
    };

    const response = await request(app)
      .get('/api/metrics')
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to fetch metrics');

    // Restore original function
    (global as any).getMetrics = originalGetMetrics;
  });
}); 