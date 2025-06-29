"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mergeTokens_1 = require("../src/utils/mergeTokens");
describe('mergeTokens', () => {
    it('merges duplicate tokens by address', () => {
        const tokens = [
            { address: '0x1', price: 10, liquidity: 100, volume: 50, updatedAt: 1000 },
            { address: '0x1', price: 12, liquidity: 200, volume: 30, updatedAt: 2000 },
            { address: '0x2', price: 5, liquidity: 50, volume: 20, updatedAt: 1500 },
        ];
        const merged = (0, mergeTokens_1.mergeTokens)(tokens);
        expect(merged.length).toBe(2);
        const t1 = merged.find(t => t.address === '0x1');
        expect(t1.price).toBe(12); // latest price
        expect(t1.liquidity).toBe(200); // highest liquidity
        expect(t1.volume).toBe(80); // combined volume
    });
});
//# sourceMappingURL=mergeTokens.test.js.map