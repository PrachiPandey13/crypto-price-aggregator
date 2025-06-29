import axios from 'axios';
import { fetchAndAggregateTokens } from '../src/services/tokenService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Partial results when DEX fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns partial results when DexScreener fails', async () => {
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

    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.warning).toContain('DexScreener API is currently unavailable');
    expect(result.warning).not.toContain('GeckoTerminal');
  });

  it('returns partial results when GeckoTerminal fails', async () => {
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

    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.warning).toContain('GeckoTerminal API is currently unavailable');
    expect(result.warning).not.toContain('DexScreener');
  });

  it('returns empty result with warnings when both APIs fail', async () => {
    // Mock both APIs to fail
    mockedAxios.get.mockRejectedValue(new Error('API error'));

    const result = await fetchAndAggregateTokens({
      time: '24h',
      sort: 'volume',
      limit: 20
    });

    expect(result.tokens).toHaveLength(0);
    expect(result.warning).toContain('DexScreener API is currently unavailable');
    expect(result.warning).toContain('GeckoTerminal API is currently unavailable');
  });
}); 