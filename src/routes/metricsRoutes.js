const { Router } = require('express');
const { getMetricsEndpoint } = require('../controllers/metricsController');

const router = Router();

// GET /api/metrics - Get system metrics
router.get('/', getMetricsEndpoint);

module.exports = router; 