const { fetchAndAggregateTokens } = require('../services/tokenService');
const { recordApiResponseTime } = require('./metricsController');

async function getTokens(req, res) {
  const startTime = Date.now();
  
  try {
    // Query params
    const { time = '24h', sort = 'volume', limit = '20', nextCursor } = req.query;

    // Parse limit
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    // Fetch and aggregate tokens from service
    const result = await fetchAndAggregateTokens({
      time: time,
      sort: sort,
      limit: parsedLimit,
      nextCursor: nextCursor,
    });

    const responseTime = Date.now() - startTime;
    recordApiResponseTime(responseTime);
    console.log(`GET /api/tokens served in ${responseTime}ms`);
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordApiResponseTime(responseTime);
    console.log(`GET /api/tokens served in ${responseTime}ms (with error)`);
    
    res.status(500).json({ error: 'Failed to fetch tokens', details: error.message });
  }
}

module.exports = {
  getTokens
}; 