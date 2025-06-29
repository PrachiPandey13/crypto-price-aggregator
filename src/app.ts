import express from 'express';
import cors from 'cors';
import tokenRoutes from './routes/tokenRoutes';
import metricsRoutes from './routes/metricsRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(tokenRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy!' });
});

export default app; 