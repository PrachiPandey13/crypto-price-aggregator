import { Router } from 'express';

const router = Router();

router.get('/api/tokens', (req, res) => {
  res.json({ message: 'Token data endpoint' });
});

export default router; 