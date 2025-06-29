"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeTokens = mergeTokens;
/**
 * Merges duplicate tokens (by address) from multiple sources.
 * - Retains the latest price (by updatedAt)
 * - Keeps the highest liquidity
 * - Sums the volume
 */
function mergeTokens(tokens) {
    const map = new Map();
    for (const token of tokens) {
        const existing = map.get(token.address);
        if (!existing) {
            map.set(token.address, Object.assign({}, token));
        }
        else {
            // Log the merge operation
            const tokenName = token.name || token.address;
            const existingName = existing.name || existing.address;
            const existingSource = existing.source || 'Unknown';
            const tokenSource = token.source || 'Unknown';
            console.log(`Merging duplicate token: ${tokenName} from ${existingSource} and ${tokenSource} with combined volume.`);
            // Latest price by updatedAt
            const latestPrice = token.updatedAt > existing.updatedAt ? token.price : existing.price;
            const latestUpdatedAt = Math.max(token.updatedAt, existing.updatedAt);
            // Highest liquidity
            const highestLiquidity = Math.max(token.liquidity, existing.liquidity);
            // Combined volume
            const combinedVolume = (existing.volume || 0) + (token.volume || 0);
            map.set(token.address, Object.assign(Object.assign(Object.assign({}, existing), token), { price: latestPrice, updatedAt: latestUpdatedAt, liquidity: highestLiquidity, volume: combinedVolume, 
                // Keep track of all sources
                sources: [existingSource, tokenSource].filter((s, i, arr) => arr.indexOf(s) === i) }));
        }
    }
    return Array.from(map.values());
}
//# sourceMappingURL=mergeTokens.js.map