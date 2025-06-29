import { filterSortPaginate, FilterSortPaginateParams } from '../src/utils/filterSortPaginate';
import { Token } from '../src/utils/mergeTokens';

describe('filterSortPaginate', () => {
  const tokens: Token[] = [
    { address: 'a', price: 1, liquidity: 10, volume: 100, updatedAt: 1, volume_1h: 10, volume_24h: 100, volume_7d: 700, price_change_1h: 0.1, price_change_24h: 0.5, price_change_7d: 1, market_cap: 1000 },
    { address: 'b', price: 2, liquidity: 20, volume: 200, updatedAt: 2, volume_1h: 20, volume_24h: 200, volume_7d: 1400, price_change_1h: 0.2, price_change_24h: 0.6, price_change_7d: 2, market_cap: 2000 },
    { address: 'c', price: 3, liquidity: 30, volume: 300, updatedAt: 3, volume_1h: 30, volume_24h: 300, volume_7d: 2100, price_change_1h: 0.3, price_change_24h: 0.7, price_change_7d: 3, market_cap: 3000 },
  ];

  it('sorts by volume for 1h', () => {
    const params: FilterSortPaginateParams = { time: '1h', sort: 'volume', limit: 3 };
    const { tokens: result } = filterSortPaginate(tokens, params);
    expect(result[0].address).toBe('c');
    expect(result[1].address).toBe('b');
    expect(result[2].address).toBe('a');
  });

  it('sorts by price change for 7d', () => {
    const params: FilterSortPaginateParams = { time: '7d', sort: 'priceChange', limit: 3 };
    const { tokens: result } = filterSortPaginate(tokens, params);
    expect(result[0].address).toBe('c');
    expect(result[1].address).toBe('b');
    expect(result[2].address).toBe('a');
  });

  it('sorts by market cap', () => {
    const params: FilterSortPaginateParams = { time: '24h', sort: 'marketCap', limit: 3 };
    const { tokens: result } = filterSortPaginate(tokens, params);
    expect(result[0].address).toBe('c');
    expect(result[1].address).toBe('b');
    expect(result[2].address).toBe('a');
  });

  it('paginates with nextCursor', () => {
    const params: FilterSortPaginateParams = { time: '24h', sort: 'marketCap', limit: 2 };
    const { tokens: page1, nextCursor } = filterSortPaginate(tokens, params);
    expect(page1.length).toBe(2);
    expect(nextCursor).toBe('b');
    const { tokens: page2 } = filterSortPaginate(tokens, { ...params, nextCursor });
    expect(page2.length).toBe(1);
    expect(page2[0].address).toBe('a');
  });
}); 