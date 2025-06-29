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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFromDexScreener = fetchFromDexScreener;
exports.fetchFromGeckoTerminal = fetchFromGeckoTerminal;
exports.fetchAndAggregateTokens = fetchAndAggregateTokens;
const axios_1 = __importDefault(require("axios"));
const redisClient_1 = require("../cache/redisClient");
const memoryCache_1 = require("../cache/memoryCache");
const mergeTokens_1 = require("../utils/mergeTokens");
const metricsController_1 = require("../controllers/metricsController");
// Helper function to generate random jitter delay
function getJitterDelay(maxJitterMs = 1000) {
    return Math.floor(Math.random() * maxJitterMs);
}
function exponentialBackoffRequest(url_1, apiName_1) {
    return __awaiter(this, arguments, void 0, function* (url, apiName, options = {}, maxRetries = 5, baseDelay = 500, maxJitterMs = 1000) {
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                return yield axios_1.default.get(url, options);
            }
            catch (error) {
                if (error.response && error.response.status === 429 && attempt < maxRetries) {
                    // Calculate exponential backoff with jitter
                    const exponentialDelay = baseDelay * Math.pow(2, attempt);
                    const jitterDelay = getJitterDelay(maxJitterMs);
                    const totalDelay = exponentialDelay + jitterDelay;
                    console.log(`Retrying ${apiName} API - Attempt ${attempt + 1} after ${totalDelay}ms (base: ${exponentialDelay}ms, jitter: ${jitterDelay}ms)`);
                    yield new Promise(res => setTimeout(res, totalDelay));
                    attempt++;
                }
                else {
                    throw error;
                }
            }
        }
    });
}
function fetchFromDexScreener(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
        const response = yield exponentialBackoffRequest(url, 'DexScreener');
        return response.data;
    });
}
function fetchFromGeckoTerminal() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = 'https://api.geckoterminal.com/api/v2/networks/solana/tokens';
        const response = yield exponentialBackoffRequest(url, 'GeckoTerminal');
        return response.data;
    });
}
// Helper to generate a cache key based on params
function getCacheKey(params) {
    return `tokens:${params.time || '24h'}:${params.sort || 'volume'}:${params.limit || 20}:${params.nextCursor || ''}`;
}
function fetchAndAggregateTokens(params_1) {
    return __awaiter(this, arguments, void 0, function* (params, cacheTTL = 30) {
        const cacheKey = getCacheKey(params);
        // Layer 1: Check Memory Cache (5 seconds TTL)
        const memoryCached = memoryCache_1.memoryCache.get(cacheKey);
        if (memoryCached) {
            console.log(`Memory Cache HIT for key: ${cacheKey}`);
            (0, metricsController_1.recordCacheHit)();
            return memoryCached;
        }
        // Layer 2: Check Redis Cache
        const redisCached = yield (0, redisClient_1.getTokenCache)(cacheKey);
        if (redisCached) {
            const parsedData = JSON.parse(redisCached);
            // Store in memory cache for faster subsequent access
            memoryCache_1.memoryCache.set(cacheKey, parsedData, 5);
            console.log(`Redis Cache HIT for key: ${cacheKey}`);
            (0, metricsController_1.recordCacheHit)();
            return parsedData;
        }
        // Layer 3: Fetch from DEX APIs
        console.log(`DEX Fetch for key: ${cacheKey}`);
        (0, metricsController_1.recordCacheMiss)();
        const warnings = [];
        const allTokens = [];
        // Fetch from DexScreener with error handling
        try {
            const dexData = yield fetchFromDexScreener('solana');
            if (dexData.tokens) {
                allTokens.push(...dexData.tokens);
            }
        }
        catch (error) {
            console.error('DexScreener API failed:', error);
            warnings.push('DexScreener API is currently unavailable');
        }
        // Fetch from GeckoTerminal with error handling
        try {
            const geckoData = yield fetchFromGeckoTerminal();
            if (geckoData.data) {
                const normalizedTokens = geckoData.data.map((t) => {
                    var _a, _b, _c, _d;
                    return (Object.assign({ address: t.id, price: Number((_a = t.attributes) === null || _a === void 0 ? void 0 : _a.price_usd) || 0, liquidity: Number((_b = t.attributes) === null || _b === void 0 ? void 0 : _b.liquidity_usd) || 0, volume: Number((_c = t.attributes) === null || _c === void 0 ? void 0 : _c.volume_usd) || 0, updatedAt: new Date(((_d = t.attributes) === null || _d === void 0 ? void 0 : _d.last_priced_at) || Date.now()).getTime() }, t.attributes));
                });
                allTokens.push(...normalizedTokens);
            }
        }
        catch (error) {
            console.error('GeckoTerminal API failed:', error);
            warnings.push('GeckoTerminal API is currently unavailable');
        }
        const merged = (0, mergeTokens_1.mergeTokens)(allTokens);
        // TODO: filter, sort, paginate based on params
        const result = Object.assign({ tokens: merged }, (warnings.length > 0 && { warning: warnings.join('; ') }));
        // Store in both Redis and Memory cache
        yield (0, redisClient_1.setTokenCache)(cacheKey, JSON.stringify(result), cacheTTL);
        memoryCache_1.memoryCache.set(cacheKey, result, 5);
        return result;
    });
}
//# sourceMappingURL=tokenService.js.map