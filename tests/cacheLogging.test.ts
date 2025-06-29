import { setTokenCache, getTokenCache } from '../src/cache/redisClient';

// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages: string[] = [];

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

describe('Cache logging', () => {
  it('logs cache miss when key does not exist', async () => {
    const key = 'test:cache:miss';
    await getTokenCache(key);
    
    expect(logMessages).toContain(`Cache MISS for key: ${key}`);
  });

  it('logs cache hit when key exists', async () => {
    const key = 'test:cache:hit';
    const value = 'test-value';
    
    await setTokenCache(key, value, 5);
    await getTokenCache(key);
    
    expect(logMessages).toContain(`Cache HIT for key: ${key}`);
  });

  it('logs cache miss after TTL expires', async () => {
    const key = 'test:cache:expire';
    const value = 'test-value';
    
    await setTokenCache(key, value, 1);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Wait for TTL
    await getTokenCache(key);
    
    expect(logMessages).toContain(`Cache MISS for key: ${key}`);
  });
}); 