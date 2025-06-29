import { Router } from 'express';
import { getMetricsEndpoint } from '../controllers/metricsController';

const router = Router();

// GET /api/metrics - Get system metrics
router.get('/', getMetricsEndpoint);

export default router; 