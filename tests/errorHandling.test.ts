import * as tokenService from '../src/services/tokenService';
import * as tokenController from '../src/controllers/tokenController';
import { Request, Response } from 'express';

describe('tokenController error handling', () => {
  it('returns 500 on service error', async () => {
    jest.spyOn(tokenService, 'fetchAndAggregateTokens').mockRejectedValueOnce(new Error('API failed'));
    const req = { query: {} } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    await tokenController.getTokens(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch tokens' }));
  });
}); 