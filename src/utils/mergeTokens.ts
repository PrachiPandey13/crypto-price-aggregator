export interface Token {
  address: string;
  price: number;
  liquidity: number;
  volume: number;
  updatedAt: number; // timestamp for latest price
  name?: string; // token name for logging
  source?: string; // source API for logging
  [key: string]: any;
}

/**
 * Merges duplicate tokens (by address) from multiple sources.
 * - Retains the latest price (by updatedAt)
 * - Keeps the highest liquidity
 * - Sums the volume
 */
export function mergeTokens(tokens: Token[]): Token[] {
  const map = new Map<string, Token>();

  for (const token of tokens) {
    const existing = map.get(token.address);
    if (!existing) {
      map.set(token.address, { ...token });
    } else {
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
      map.set(token.address, {
        ...existing,
        ...token,
        price: latestPrice,
        updatedAt: latestUpdatedAt,
        liquidity: highestLiquidity,
        volume: combinedVolume,
        // Keep track of all sources
        sources: [existingSource, tokenSource].filter((s, i, arr) => arr.indexOf(s) === i)
      });
    }
  }

  return Array.from(map.values());
} 