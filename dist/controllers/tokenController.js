"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokens = getTokens;
const tokenService_1 = require("../services/tokenService");
const metricsController_1 = require("./metricsController");
function getTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        try {
            // Query params
            const { time = '24h', sort = 'volume', limit = '20', nextCursor } = req.query;
            // Parse limit
            const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
            // Fetch and aggregate tokens from service
            const result = yield (0, tokenService_1.fetchAndAggregateTokens)({
                time: time,
                sort: sort,
                limit: parsedLimit,
                nextCursor: nextCursor,
            });
            const responseTime = Date.now() - startTime;
            (0, metricsController_1.recordApiResponseTime)(responseTime);
            console.log(`GET /api/tokens served in ${responseTime}ms`);
            res.json(result);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            (0, metricsController_1.recordApiResponseTime)(responseTime);
            console.log(`GET /api/tokens served in ${responseTime}ms (with error)`);
            res.status(500).json({ error: 'Failed to fetch tokens', details: error.message });
        }
    });
}
//# sourceMappingURL=tokenController.js.map