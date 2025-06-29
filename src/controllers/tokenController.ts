import { Request, Response } from 'express';
import { fetchAndAggregateTokens } from '../services/tokenService';
import { recordApiResponseTime } from './metricsController';

export async function getTokens(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Query params
    const { time = '24h', sort = 'volume', limit = '20', nextCursor } = req.query;

    // Parse limit
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));

    // Fetch and aggregate tokens from service
    const result = await fetchAndAggregateTokens({
      time: time as string,
      sort: sort as string,
      limit: parsedLimit,
      nextCursor: nextCursor as string | undefined,
    });

    const responseTime = Date.now() - startTime;
    recordApiResponseTime(responseTime);
    console.log(`GET /api/tokens served in ${responseTime}ms`);
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordApiResponseTime(responseTime);
    console.log(`GET /api/tokens served in ${responseTime}ms (with error)`);
    
    res.status(500).json({ error: 'Failed to fetch tokens', details: (error as Error).message });
  }
} 