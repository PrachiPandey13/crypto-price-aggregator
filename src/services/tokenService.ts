import axios from 'axios';
import redis, { setTokenCache, getTokenCache } from '../cache/redisClient';
import { memoryCache } from '../cache/memoryCache';
import { mergeTokens } from '../utils/mergeTokens';
import { recordCacheHit, recordCacheMiss } from '../controllers/metricsController';

// Helper function to generate random jitter delay
function getJitterDelay(maxJitterMs: number = 1000): number {
  return Math.floor(Math.random() * maxJitterMs);
}

async function exponentialBackoffRequest(url: string, apiName: string, options: any = {}, maxRetries = 5, baseDelay = 500, maxJitterMs = 1000): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await axios.get(url, options);
    } catch (error: any) {
      if (error.response && error.response.status === 429 && attempt < maxRetries) {
        // Calculate exponential backoff with jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitterDelay = getJitterDelay(maxJitterMs);
        const totalDelay = exponentialDelay + jitterDelay;
        
        console.log(`Retrying ${apiName} API - Attempt ${attempt + 1} after ${totalDelay}ms (base: ${exponentialDelay}ms, jitter: ${jitterDelay}ms)`);
        await new Promise(res => setTimeout(res, totalDelay));
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

export async function fetchFromDexScreener(query: string) {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
  const response = await exponentialBackoffRequest(url, 'DexScreener');
  return response.data;
}

export async function fetchFromGeckoTerminal() {
  const url = 'https://api.geckoterminal.com/api/v2/networks/solana/tokens';
  const response = await exponentialBackoffRequest(url, 'GeckoTerminal');
  return response.data;
}

// Helper to generate a cache key based on params
function getCacheKey(params: any) {
  return `tokens:${params.time || '24h'}:${params.sort || 'volume'}:${params.limit || 20}:${params.nextCursor || ''}`;
}

export async function fetchAndAggregateTokens(params: any, cacheTTL: number = 30) {
  const cacheKey = getCacheKey(params);
  
  // Layer 1: Check Memory Cache (5 seconds TTL)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached) {
    console.log(`Memory Cache HIT for key: ${cacheKey}`);
    recordCacheHit();
    return memoryCached;
  }

  // Layer 2: Check Redis Cache
  const redisCached = await getTokenCache(cacheKey);
  if (redisCached) {
    const parsedData = JSON.parse(redisCached);
    // Store in memory cache for faster subsequent access
    memoryCache.set(cacheKey, parsedData, 5);
    console.log(`Redis Cache HIT for key: ${cacheKey}`);
    recordCacheHit();
    return parsedData;
  }

  // Layer 3: Fetch from DEX APIs
  console.log(`DEX Fetch for key: ${cacheKey}`);
  recordCacheMiss();
  
  const warnings: string[] = [];
  const allTokens: any[] = [];

  // Fetch from DexScreener with error handling
  try {
    const dexData = await fetchFromDexScreener('solana');
    if (dexData.tokens) {
      allTokens.push(...dexData.tokens);
    }
  } catch (error) {
    console.error('DexScreener API failed:', error);
    warnings.push('DexScreener API is currently unavailable');
  }

  // Fetch from GeckoTerminal with error handling
  try {
    const geckoData = await fetchFromGeckoTerminal();
    if (geckoData.data) {
      const normalizedTokens = geckoData.data.map((t: any) => ({
        address: t.id,
        price: Number(t.attributes?.price_usd) || 0,
        liquidity: Number(t.attributes?.liquidity_usd) || 0,
        volume: Number(t.attributes?.volume_usd) || 0,
        updatedAt: new Date(t.attributes?.last_priced_at || Date.now()).getTime(),
        ...t.attributes,
      }));
      allTokens.push(...normalizedTokens);
    }
  } catch (error) {
    console.error('GeckoTerminal API failed:', error);
    warnings.push('GeckoTerminal API is currently unavailable');
  }

  const merged = mergeTokens(allTokens);

  // TODO: filter, sort, paginate based on params
  const result = { 
    tokens: merged,
    ...(warnings.length > 0 && { warning: warnings.join('; ') })
  };

  // Store in both Redis and Memory cache
  await setTokenCache(cacheKey, JSON.stringify(result), cacheTTL);
  memoryCache.set(cacheKey, result, 5);
  
  return result;
} 