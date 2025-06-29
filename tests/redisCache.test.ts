import { setTokenCache, getTokenCache } from '../src/cache/redisClient';

describe('Redis cache', () => {
  it('sets and gets token cache', async () => {
    const key = 'test:token';
    const value = JSON.stringify({ foo: 'bar' });
    await setTokenCache(key, value, 2); // 2 seconds TTL
    const cached = await getTokenCache(key);
    expect(cached).toBe(value);
  });

  it('expires cache after TTL', async () => {
    const key = 'test:expire';
    const value = 'baz';
    await setTokenCache(key, value, 1); // 1 second TTL
    await new Promise(res => setTimeout(res, 1200));
    const cached = await getTokenCache(key);
    expect(cached).toBeNull();
  });
}); 