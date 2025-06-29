"use strict";
// const { setTokenCache, getTokenCache } = require('../src/cache/redisClient'); // Redis disabled
const { memoryCache } = require('../src/cache/memoryCache');

describe('Cache logging', () => {
  beforeEach(() => {
    // Clear memory cache before each test
    memoryCache.clear();
  });

  it('should log memory cache hits and misses', async () => {
    const logMessages = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logMessages.push(args.join(' '));
    };

    // Test memory cache hit
    const testData = { test: 'data' };
    memoryCache.set('test-key', testData, 5);
    const cached = memoryCache.get('test-key');

    expect(cached).toEqual(testData);

    // Test memory cache miss
    const missed = memoryCache.get('non-existent-key');
    expect(missed).toBeUndefined();

    console.log = originalLog;

    // Verify logging behavior (memory cache only)
    expect(logMessages.length).toBeGreaterThan(0);
  });

  it('should work without Redis cache layer', async () => {
    // Test that the system works with only memory cache
    const testData = { tokens: [{ address: 'test', price: 100 }] };
    memoryCache.set('tokens:24h:volume:20:', testData, 5);
    
    const cached = memoryCache.get('tokens:24h:volume:20:');
    expect(cached).toEqual(testData);
  });
});

//# sourceMappingURL=cacheLogging.test.js.map