"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { mergeTokens } = require('../src/utils/mergeTokens');
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
describe('Token merging logs', () => {
    it('logs when duplicate tokens are merged', () => {
        const tokens = [
            {
                address: '0x123',
                name: 'PIPE',
                source: 'DexScreener',
                price: 10,
                liquidity: 100,
                volume: 50,
                updatedAt: 1000
            },
            {
                address: '0x123',
                name: 'PIPE',
                source: 'GeckoTerminal',
                price: 12,
                liquidity: 200,
                volume: 30,
                updatedAt: 2000
            }
        ];
        const merged = mergeTokens(tokens);
        expect(merged).toHaveLength(1);
        expect(logMessages).toContain('Merging duplicate token: PIPE from DexScreener and GeckoTerminal with combined volume.');
    });
    it('logs with token address when name is not available', () => {
        const tokens = [
            {
                address: '0x456',
                source: 'DexScreener',
                price: 5,
                liquidity: 50,
                volume: 25,
                updatedAt: 1500
            },
            {
                address: '0x456',
                source: 'GeckoTerminal',
                price: 6,
                liquidity: 75,
                volume: 35,
                updatedAt: 2500
            }
        ];
        const merged = mergeTokens(tokens);
        expect(merged).toHaveLength(1);
        expect(logMessages).toContain('Merging duplicate token: 0x456 from DexScreener and GeckoTerminal with combined volume.');
    });
    it('does not log when no duplicates exist', () => {
        const tokens = [
            {
                address: '0x123',
                name: 'TOKEN1',
                source: 'DexScreener',
                price: 10,
                liquidity: 100,
                volume: 50,
                updatedAt: 1000
            },
            {
                address: '0x456',
                name: 'TOKEN2',
                source: 'GeckoTerminal',
                price: 12,
                liquidity: 200,
                volume: 30,
                updatedAt: 2000
            }
        ];
        const merged = mergeTokens(tokens);
        expect(merged).toHaveLength(2);
        expect(logMessages).not.toContain('Merging duplicate token');
    });
});
//# sourceMappingURL=tokenMerging.test.js.map