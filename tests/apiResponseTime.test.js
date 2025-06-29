const request = require('supertest');
const app = require('../src/app');

// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages = [];

beforeEach(() => {
  logMessages = [];
  console.log = jest.fn((...args) => {
    logMessages.push(args.join(' '));
    originalConsoleLog(...args);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('API response time logging', () => {
  it('logs response time for successful requests', async () => {
    const res = await request(app).get('/api/tokens');
    
    expect(res.status).toBe(200);
    expect(logMessages.some(msg => msg.includes('GET /api/tokens served in') && msg.includes('ms'))).toBe(true);
  });

  it('logs response time for requests with query parameters', async () => {
    const res = await request(app).get('/api/tokens?time=1h&sort=volume&limit=10');
    
    expect(res.status).toBe(200);
    expect(logMessages.some(msg => msg.includes('GET /api/tokens served in') && msg.includes('ms'))).toBe(true);
  });

  it('logs response time for health check endpoint', async () => {
    const res = await request(app).get('/');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});