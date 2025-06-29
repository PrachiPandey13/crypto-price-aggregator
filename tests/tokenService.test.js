const axios = require('axios');
const tokenService = require('../src/services/tokenService');

jest.mock('axios');
const mockedAxios = axios;

describe('tokenService', () => {
  afterEach(() => jest.clearAllMocks());

  it('retries on 429 rate limit error (exponential backoff)', async () => {
    let callCount = 0;
    mockedAxios.get.mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        const err = new Error('429');
        err.response = { status: 429 };
        throw err;
      }
      return { data: { tokens: [] } };
    });
    const data = await tokenService.fetchFromDexScreener('solana');
    expect(data).toHaveProperty('tokens');
    expect(callCount).toBe(3);
  });

  it('throws on non-429 error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(tokenService.fetchFromDexScreener('solana')).rejects.toThrow('Network error');
  });
});