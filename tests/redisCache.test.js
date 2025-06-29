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
Object.defineProperty(exports, "__esModule", { value: true });
// const { setTokenCache, getTokenCache } = require('../src/cache/redisClient'); // Redis disabled
const { setTokenCache, getTokenCache } = require('../src/cache/redisClient');

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

describe('Redis cache (disabled)', () => {
    it('should return null for getTokenCache when Redis is disabled', async () => {
        const result = await getTokenCache('test-key');
        expect(result).toBeNull();
    });

    it('should not throw error for setTokenCache when Redis is disabled', async () => {
        expect(async () => {
            await setTokenCache('test-key', 'test-value', 30);
        }).not.toThrow();
    });

    it('should log that Redis is disabled', async () => {
        const logMessages = [];
        const originalLog = console.log;
        console.log = (...args) => {
            logMessages.push(args.join(' '));
        };

        await getTokenCache('test-key');
        await setTokenCache('test-key', 'test-value', 30);

        expect(logMessages).toContain('Redis disabled - getTokenCache called for key: test-key (returning null)');
        expect(logMessages).toContain('Redis disabled - setTokenCache called for key: test-key (no-op)');

        console.log = originalLog;
    });
});
//# sourceMappingURL=redisCache.test.js.map