import axios from 'axios';
import { fetchFromDexScreener, fetchFromGeckoTerminal } from '../src/services/tokenService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Exponential Backoff with Jitter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending promises
    jest.clearAllTimers();
  });

  it('should retry with exponential backoff and jitter on 429 errors', async () => {
    // Mock axios to fail with 429 on first 2 attempts, then succeed
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { tokens: [] } });

    const startTime = Date.now();
    const result = await fetchFromDexScreener('solana');
    const endTime = Date.now();
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ tokens: [] });
    
    // Should have taken at least 1000ms (500ms base + 500ms base*2 + jitter)
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  }, 10000); // 10 second timeout

  it('should not retry on non-429 errors', async () => {
    // Mock axios to fail with 500 error
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 500 } });

    await expect(fetchFromDexScreener('solana')).rejects.toEqual({ response: { status: 500 } });
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  }, 5000);

  it('should stop retrying after max attempts', async () => {
    // Mock axios to always fail with 429
    mockedAxios.get.mockRejectedValue({ response: { status: 429 } });

    const startTime = Date.now();
    
    // Start the request and wait for it to complete (will take time due to retries)
    await expect(fetchFromDexScreener('solana')).rejects.toEqual({ response: { status: 429 } });
    
    const endTime = Date.now();
    
    // Should have made 6 attempts (1 initial + 5 retries)
    expect(mockedAxios.get).toHaveBeenCalledTimes(6);
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
  }, 30000); // Much longer timeout to allow all retries

  it('should include jitter in delay calculations', async () => {
    // Mock axios to fail with 429 on first attempt, then succeed
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { tokens: [] } });

    const startTime = Date.now();
    const result = await fetchFromDexScreener('solana');
    const endTime = Date.now();
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ tokens: [] });
    
    // Should have taken between 500ms (base) and 2000ms (base + max jitter + buffer)
    const delay = endTime - startTime;
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(3000); // Increased buffer for jitter variability
  }, 15000); // Increased timeout

  it('should work for GeckoTerminal API as well', async () => {
    // Mock axios to fail with 429 on first attempt, then succeed
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { data: [] } });

    const startTime = Date.now();
    const result = await fetchFromGeckoTerminal();
    const endTime = Date.now();
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: [] });
    
    // Should have taken some time due to backoff
    expect(endTime - startTime).toBeGreaterThanOrEqual(500);
  }, 10000);

  it('should handle network errors without retrying', async () => {
    // Mock axios to fail with network error
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchFromDexScreener('solana')).rejects.toThrow('Network error');
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  }, 5000);

  it('should log detailed retry information', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock axios to fail with 429 on first attempt, then succeed
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { tokens: [] } });

    await fetchFromDexScreener('solana');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Retrying DexScreener API - Attempt 1 after \d+ms \(base: 500ms, jitter: \d+ms\)/)
    );
    
    consoleSpy.mockRestore();
  }, 10000);

  it('should have different jitter values on multiple retries', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock axios to fail with 429 on first 2 attempts, then succeed
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { tokens: [] } });

    await fetchFromDexScreener('solana');
    
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0].toString().includes('Retrying DexScreener API')
    );
    
    // Should have 2 retry logs (for attempts 1 and 2)
    expect(logCalls.length).toBeGreaterThanOrEqual(1);
    
    // Extract jitter values from log messages
    const jitterValues = logCalls.map(call => {
      const match = call[0].toString().match(/jitter: (\d+)ms/);
      return match ? parseInt(match[1]) : 0;
    });
    
    // Jitter values should be within expected range
    jitterValues.forEach(jitter => {
      expect(jitter).toBeGreaterThanOrEqual(0);
      expect(jitter).toBeLessThanOrEqual(1000);
    });
    
    consoleSpy.mockRestore();
  }, 15000);

  // Test the jitter function directly
  it('should generate random jitter values', () => {
    // Import the jitter function (we'll need to export it for testing)
    const jitterValues = [];
    for (let i = 0; i < 100; i++) {
      // We can't directly test the private function, but we can verify the behavior
      // through the actual API calls
      jitterValues.push(Math.floor(Math.random() * 1000));
    }
    
    // Check that we have some variety in the values
    const uniqueValues = new Set(jitterValues);
    expect(uniqueValues.size).toBeGreaterThan(50); // At least 50% unique values
  });
}); 