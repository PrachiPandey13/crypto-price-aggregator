const { Router } = require('express');
const { getTokens } = require('../controllers/tokenController');

const router = Router();

router.get('/api/tokens', getTokens);

module.exports = router; 