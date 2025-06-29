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
const axios_1 = __importDefault(require("axios"));
const tokenService_1 = require("../src/services/tokenService");
const memoryCache_1 = require("../src/cache/memoryCache");
const redisClient_1 = require("../src/cache/redisClient");
jest.mock('axios');
const mockedAxios = axios_1.default;
// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages = [];
beforeEach(() => {
    logMessages = [];
    console.log = jest.fn((...args) => {
        logMessages.push(args.join(' '));
        originalConsoleLog(...args);
    });
    memoryCache_1.memoryCache.clear();
    jest.clearAllMocks();
});
afterEach(() => {
    console.log = originalConsoleLog;
});
describe('Multi-layer cache system', () => {
    it('serves from memory cache when available', () => __awaiter(void 0, void 0, void 0, function* () {
        const testData = { tokens: [{ address: 'test', price: 1 }] };
        const cacheKey = 'tokens:24h:volume:20:';
        // Pre-populate memory cache
        memoryCache_1.memoryCache.set(cacheKey, testData, 5);
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result).toEqual(testData);
        expect(logMessages).toContain(`Memory Cache HIT for key: ${cacheKey}`);
        expect(logMessages).not.toContain('Redis Cache HIT');
        expect(logMessages).not.toContain('DEX Fetch');
    }));
    it('serves from Redis cache when memory cache is empty', () => __awaiter(void 0, void 0, void 0, function* () {
        const testData = { tokens: [{ address: 'test', price: 1 }] };
        const cacheKey = 'tokens:24h:volume:20:';
        // Pre-populate Redis cache
        yield (0, redisClient_1.setTokenCache)(cacheKey, JSON.stringify(testData), 30);
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result).toEqual(testData);
        expect(logMessages).toContain(`Redis Cache HIT for key: ${cacheKey}`);
        expect(logMessages).not.toContain('Memory Cache HIT');
        expect(logMessages).not.toContain('DEX Fetch');
    }));
    it('fetches from DEX APIs when both caches are empty', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock successful API responses
        mockedAxios.get.mockResolvedValueOnce({
            data: { tokens: [{ address: 'dex1', price: 1 }] }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { data: [{ id: 'gecko1', attributes: { price_usd: '2' } }] }
        });
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result.tokens).toBeDefined();
        expect(logMessages).toContain('DEX Fetch for key: tokens:24h:volume:20:');
        expect(logMessages).not.toContain('Memory Cache HIT');
        expect(logMessages).not.toContain('Redis Cache HIT');
    }));
    it('stores data in both caches after DEX fetch', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock successful API responses
        mockedAxios.get.mockResolvedValueOnce({
            data: { tokens: [{ address: 'dex1', price: 1 }] }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { data: [{ id: 'gecko1', attributes: { price_usd: '2' } }] }
        });
        yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        // Verify data is stored in memory cache
        const memoryData = memoryCache_1.memoryCache.get('tokens:24h:volume:20:');
        expect(memoryData).toBeDefined();
        expect(memoryData.tokens).toBeDefined();
    }));
    it('memory cache expires after TTL', () => __awaiter(void 0, void 0, void 0, function* () {
        const testData = { tokens: [{ address: 'test', price: 1 }] };
        const cacheKey = 'tokens:24h:volume:20:';
        // Set with 1 second TTL
        memoryCache_1.memoryCache.set(cacheKey, testData, 1);
        // Wait for expiration
        yield new Promise(resolve => setTimeout(resolve, 1200));
        const cached = memoryCache_1.memoryCache.get(cacheKey);
        expect(cached).toBeNull();
    }));
});
//# sourceMappingURL=multiLayerCache.test.js.map