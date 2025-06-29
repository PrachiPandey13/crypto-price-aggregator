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
const axios = require('axios');
const { fetchAndAggregateTokens } = require('../src/services/tokenService');
const { memoryCache } = require('../src/cache/memoryCache');
const { setTokenCache } = require('../src/cache/redisClient');
const request = require('supertest');
const express = require('express');
const tokenRoutes = require('../src/routes/tokenRoutes');
jest.mock('axios');
const mockedAxios = axios;
// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages = [];
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
describe('Multi-layer cache', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use('/api', tokenRoutes);
        memoryCache.clear();
    });
    it('serves from memory cache when available', async () => {
        const testData = {
            tokens: [{ address: 'test', price: 100, volume: 1000 }],
            nextCursor: 'next',
            total: 1
        };
        const cacheKey = 'tokens:24h:volume:20:';
        memoryCache.set(cacheKey, testData, 5);
        const response = await request(app)
            .get('/api/tokens')
            .query({ time: '24h', sort: 'volume', limit: 20 });
        expect(response.status).toBe(200);
        expect(response.body.tokens).toHaveLength(1);
        expect(logMessages).toContain('Memory Cache HIT');
    });
    it('fetches from API when memory cache is empty', async () => {
        const response = await request(app)
            .get('/api/tokens')
            .query({ time: '24h', sort: 'volume', limit: 20 });
        expect(response.status).toBe(200);
        expect(logMessages).toContain('DEX Fetch');
    });
    it('works with only memory cache layer', async () => {
        const testData = { tokens: [{ address: 'test', price: 100 }] };
        memoryCache.set('test-key', testData, 5);
        const cached = memoryCache.get('test-key');
        expect(cached).toEqual(testData);
    });
});
//# sourceMappingURL=multiLayerCache.test.js.map