"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metricsController_1 = require("../controllers/metricsController");
const router = (0, express_1.Router)();
// GET /api/metrics - Get system metrics
router.get('/', metricsController_1.getMetricsEndpoint);
exports.default = router;
