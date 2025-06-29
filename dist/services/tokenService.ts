import axios from 'axios';
import { setTokenCache, getTokenCache } from '../cache/redisClient';
import { memoryCache } from '../cache/memoryCache';
import { mergeTokens } from '../utils/mergeTokens';
import { recordCacheHit, recordCacheMiss } from '../controllers/metricsController';
import { filterSortPaginate } from '../utils/filterSortPaginate';

// Helper function to generate random jitter delay
function getJitterDelay(maxJitterMs: number = 1000): number {
    return Math.floor(Math.random() * maxJitterMs);
}

// Exponential backoff function
async function exponentialBackoffRequest(
    url: string,
    apiName: string,
    options: any = {},
    maxRetries = 5,
    baseDelay = 500,
    maxJitterMs = 1000
): Promise<any> {
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            return await axios.get(url, options);
        } catch (error: any) {
            if (error.response && error.response.status === 429 && attempt < maxRetries) {
                const exponentialDelay = baseDelay * Math.pow(2, attempt);
                const jitterDelay = getJitterDelay(maxJitterMs);
                const totalDelay = exponentialDelay + jitterDelay;

                console.log(`Retrying ${apiName} API - Attempt ${attempt + 1} after ${totalDelay}ms`);
                await new Promise((res) => setTimeout(res, totalDelay));
                attempt++;
            } else {
                throw error;
            }
        }
    }
}

// Dex Screener fetch
export async function fetchFromDexScreener(query: string) {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
    const response = await exponentialBackoffRequest(url, 'DexScreener');
    return response.data;
}

// GeckoTerminal fetch with correct version header
export async function fetchFromGeckoTerminal() {
    const url = 'https://api.geckoterminal.com/api/v2/tokens/info_recently_updated';
    const headers = {
        Accept: 'application/json; version=20230302'
    };
    const response = await exponentialBackoffRequest(url, 'GeckoTerminal', { headers });
    return response.data;


}

// Cache key generator
function getCacheKey(params: any) {
    return `tokens:${params.time || '24h'}:${params.sort || 'volume'}:${params.limit || 20}:${params.nextCursor || ''}`;
}

// Main data aggregator
export async function fetchAndAggregateTokens(params: any, cacheTTL: number = 30) {
    const cacheKey = getCacheKey(params);

    // Memory Cache Check
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
        console.log(`Memory Cache HIT for key: ${cacheKey}`);
        recordCacheHit();
        return memoryCached;
    }

    // Redis Cache Check
    /*
    const redisCached = await getTokenCache(cacheKey);
    if (redisCached) {
        const parsedData = JSON.parse(redisCached);
        memoryCache.set(cacheKey, parsedData, 5);
        console.log(`Redis Cache HIT for key: ${cacheKey}`);
        recordCacheHit();
        return parsedData;
    }
        */

    // If not cached, fetch from APIs
    console.log(`DEX Fetch for key: ${cacheKey}`);
    recordCacheMiss();

    const warnings: string[] = [];
    const allTokens: any[] = [];

    // Fetch from Dex Screener
    try {
        const dexData = await fetchFromDexScreener('solana');
        if (dexData.tokens) {
            allTokens.push(...dexData.tokens);
        }
    } catch (error) {
        console.error('DexScreener API failed:', error);
        warnings.push('DexScreener API is currently unavailable');
    }

    // Fetch from Gecko Terminal
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

    // Merge, sort, paginate
    const merged = mergeTokens(allTokens);
    const result = filterSortPaginate(merged, params);

    if (warnings.length > 0) {
        (result as any).warning = warnings.join('; ');
    }

    // Store in both Redis and Memory cache
    //await setTokenCache(cacheKey, JSON.stringify(result), cacheTTL);
    memoryCache.set(cacheKey, result, 5);

    return result;
}
