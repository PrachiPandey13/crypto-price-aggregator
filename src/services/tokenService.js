const axios = require('axios');
// const redis = require('../cache/redisClient'); // Redis disabled
// const { setTokenCache, getTokenCache } = require('../cache/redisClient'); // Redis disabled
const { memoryCache } = require('../cache/memoryCache');
const { mergeTokens } = require('../utils/mergeTokens');
const { recordCacheHit, recordCacheMiss } = require('../controllers/metricsController');
const { filterSortPaginate } = require('../utils/filterSortPaginate');

function getJitterDelay(maxJitterMs = 1000) {
  return Math.floor(Math.random() * maxJitterMs);
}

async function exponentialBackoffRequest(url, apiName, options = {}, maxRetries = 5, baseDelay = 500, maxJitterMs = 1000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (error.response && error.response.status === 429 && attempt < maxRetries) {
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

async function fetchFromDexScreener(query) {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
  const response = await exponentialBackoffRequest(url, 'DexScreener');
  return response.data;
}

async function fetchFromGeckoTerminal() {
  const url = 'https://api.geckoterminal.com/api/v2/tokens/info_recently_updated';
  const response = await exponentialBackoffRequest(url, 'GeckoTerminal');
  return response.data;
}

function getCacheKey(params) {
  return `tokens:${params.time || '24h'}:${params.sort || 'volume'}:${params.limit || 20}:${params.nextCursor || ''}`;
}

async function fetchAndAggregateTokens(params, cacheTTL = 30) {
  const cacheKey = getCacheKey(params);

  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached) {
    console.log(`Memory Cache HIT for key: ${cacheKey}`);
    recordCacheHit();
    return memoryCached;
  }

  // Redis Cache Check - disabled
  // const redisCached = await getTokenCache(cacheKey);
  // if (redisCached) {
  //   const parsedData = JSON.parse(redisCached);
  //   memoryCache.set(cacheKey, parsedData, 5);
  //   console.log(`Redis Cache HIT for key: ${cacheKey}`);
  //   recordCacheHit();
  //   return parsedData;
  // }

  console.log(`DEX Fetch for key: ${cacheKey}`);
  recordCacheMiss();

  const warnings = [];
  const allTokens = [];

  try {
    const dexData = await fetchFromDexScreener('solana');
    if (dexData.tokens) {
      allTokens.push(...dexData.tokens);
    }
  } catch (error) {
    console.error('DexScreener API failed:', error);
    warnings.push('DexScreener API is currently unavailable');
  }

  try {
    const geckoData = await fetchFromGeckoTerminal();
    if (geckoData.data) {
      const normalizedTokens = geckoData.data.map((t) => ({
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
  const result = filterSortPaginate(merged, params);

  if (warnings.length > 0) {
    result.warning = warnings.join('; ');
  }

  // Store in Memory cache only (Redis disabled)
  // await setTokenCache(cacheKey, JSON.stringify(result), cacheTTL);
  memoryCache.set(cacheKey, result, 5);

  return result;
}

module.exports = {
  fetchFromDexScreener,
  fetchFromGeckoTerminal,
  fetchAndAggregateTokens
}; 