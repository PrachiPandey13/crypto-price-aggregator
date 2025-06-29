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
const redisClient_1 = require("../src/cache/redisClient");
// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages = [];
beforeEach(() => {
    logMessages = [];
    console.log = jest.fn((...args) => {
        logMessages.push(args.join(' '));
        originalConsoleLog(...args);
    });
});
afterEach(() => {
    console.log = originalConsoleLog;
});
describe('Cache logging', () => {
    it('logs cache miss when key does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'test:cache:miss';
        yield (0, redisClient_1.getTokenCache)(key);
        expect(logMessages).toContain(`Cache MISS for key: ${key}`);
    }));
    it('logs cache hit when key exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'test:cache:hit';
        const value = 'test-value';
        yield (0, redisClient_1.setTokenCache)(key, value, 5);
        yield (0, redisClient_1.getTokenCache)(key);
        expect(logMessages).toContain(`Cache HIT for key: ${key}`);
    }));
    it('logs cache miss after TTL expires', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'test:cache:expire';
        const value = 'test-value';
        yield (0, redisClient_1.setTokenCache)(key, value, 1);
        yield new Promise(resolve => setTimeout(resolve, 1200)); // Wait for TTL
        yield (0, redisClient_1.getTokenCache)(key);
        expect(logMessages).toContain(`Cache MISS for key: ${key}`);
    }));
});
//# sourceMappingURL=cacheLogging.test.js.map