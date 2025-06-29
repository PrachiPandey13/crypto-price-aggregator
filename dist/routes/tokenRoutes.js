"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/api/tokens', (req, res) => {
    res.json({ message: 'Token data endpoint' });
});
exports.default = router;
