const express = require('express');
const cors = require('cors');
const tokenRoutes = require('./routes/tokenRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(tokenRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy!' });
});

module.exports = app; 