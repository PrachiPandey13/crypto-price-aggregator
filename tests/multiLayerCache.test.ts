import axios from 'axios';
import { fetchAndAggregateTokens } from '../src/services/tokenService';
import { memoryCache } from '../src/cache/memoryCache';
import { setTokenCache } from '../src/cache/redisClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages: string[] = [];

beforeEach(() => {
  logMessages = [];
  console.log = jest.fn((...args) => {
    logMessages.push(args.join(' '));
    originalConsoleLog(...args);
  });
  memoryCache.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Multi-layer cache system', () => {
  it('serves from memory cache when available', async () => {
    const testData = { tokens: [{ address: 'test', price: 1 }] };
    const cacheKey = 'tokens:24h:volume:20:';
    
    // Pre-populate memory cache
    memoryCache.set(cacheKey, testData, 5);
    
    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });
    
    expect(result).toEqual(testData);
    expect(logMessages).toContain(`Memory Cache HIT for key: ${cacheKey}`);
    expect(logMessages).not.toContain('Redis Cache HIT');
    expect(logMessages).not.toContain('DEX Fetch');
  });

  it('serves from Redis cache when memory cache is empty', async () => {
    const testData = { tokens: [{ address: 'test', price: 1 }] };
    const cacheKey = 'tokens:24h:volume:20:';
    
    // Pre-populate Redis cache
    await setTokenCache(cacheKey, JSON.stringify(testData), 30);
    
    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });
    
    expect(result).toEqual(testData);
    expect(logMessages).toContain(`Redis Cache HIT for key: ${cacheKey}`);
    expect(logMessages).not.toContain('Memory Cache HIT');
    expect(logMessages).not.toContain('DEX Fetch');
  });

  it('fetches from DEX APIs when both caches are empty', async () => {
    // Mock successful API responses
    mockedAxios.get.mockResolvedValueOnce({
      data: { tokens: [{ address: 'dex1', price: 1 }] }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ id: 'gecko1', attributes: { price_usd: '2' } }] }
    });
    
    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });
    
    expect(result.tokens).toBeDefined();
    expect(logMessages).toContain('DEX Fetch for key: tokens:24h:volume:20:');
    expect(logMessages).not.toContain('Memory Cache HIT');
    expect(logMessages).not.toContain('Redis Cache HIT');
  });

  it('stores data in both caches after DEX fetch', async () => {
    // Mock successful API responses
    mockedAxios.get.mockResolvedValueOnce({
      data: { tokens: [{ address: 'dex1', price: 1 }] }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [{ id: 'gecko1', attributes: { price_usd: '2' } }] }
    });
    
    await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });
    
    // Verify data is stored in memory cache
    const memoryData = memoryCache.get('tokens:24h:volume:20:');
    expect(memoryData).toBeDefined();
    expect(memoryData.tokens).toBeDefined();
  });

  it('memory cache expires after TTL', async () => {
    const testData = { tokens: [{ address: 'test', price: 1 }] };
    const cacheKey = 'tokens:24h:volume:20:';
    
    // Set with 1 second TTL
    memoryCache.set(cacheKey, testData, 1);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const cached = memoryCache.get(cacheKey);
    expect(cached).toBeNull();
  });
}); 