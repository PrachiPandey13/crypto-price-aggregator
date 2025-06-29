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
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('Partial results when DEX fails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('returns partial results when DexScreener fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock DexScreener to fail
        mockedAxios.get.mockRejectedValueOnce(new Error('DexScreener API error'));
        // Mock GeckoTerminal to succeed
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                data: [
                    {
                        id: 'token1',
                        attributes: {
                            price_usd: '1.50',
                            liquidity_usd: '1000000',
                            volume_usd: '500000',
                            last_priced_at: new Date().toISOString()
                        }
                    }
                ]
            }
        });
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result.tokens).toHaveLength(1);
        expect(result.warning).toContain('DexScreener API is currently unavailable');
        expect(result.warning).not.toContain('GeckoTerminal');
    }));
    it('returns partial results when GeckoTerminal fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock DexScreener to succeed
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                tokens: [
                    {
                        address: 'token2',
                        price: 2.50,
                        liquidity: 2000000,
                        volume: 750000,
                        updatedAt: Date.now()
                    }
                ]
            }
        });
        // Mock GeckoTerminal to fail
        mockedAxios.get.mockRejectedValueOnce(new Error('GeckoTerminal API error'));
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result.tokens).toHaveLength(1);
        expect(result.warning).toContain('GeckoTerminal API is currently unavailable');
        expect(result.warning).not.toContain('DexScreener');
    }));
    it('returns empty result with warnings when both APIs fail', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock both APIs to fail
        mockedAxios.get.mockRejectedValue(new Error('API error'));
        const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
            time: '24h',
            sort: 'volume',
            limit: 20
        });
        expect(result.tokens).toHaveLength(0);
        expect(result.warning).toContain('DexScreener API is currently unavailable');
        expect(result.warning).toContain('GeckoTerminal API is currently unavailable');
    }));
});
//# sourceMappingURL=partialResults.test.js.map