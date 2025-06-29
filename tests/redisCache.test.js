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
describe('Redis cache', () => {
    it('sets and gets token cache', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'test:token';
        const value = JSON.stringify({ foo: 'bar' });
        yield (0, redisClient_1.setTokenCache)(key, value, 2); // 2 seconds TTL
        const cached = yield (0, redisClient_1.getTokenCache)(key);
        expect(cached).toBe(value);
    }));
    it('expires cache after TTL', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'test:expire';
        const value = 'baz';
        yield (0, redisClient_1.setTokenCache)(key, value, 1); // 1 second TTL
        yield new Promise(res => setTimeout(res, 1200));
        const cached = yield (0, redisClient_1.getTokenCache)(key);
        expect(cached).toBeNull();
    }));
});
//# sourceMappingURL=redisCache.test.js.map