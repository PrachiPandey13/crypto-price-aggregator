"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const tokenRoutes_1 = __importDefault(require("./routes/tokenRoutes"));
const metricsRoutes_1 = __importDefault(require("./routes/metricsRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(tokenRoutes_1.default);
app.use('/api/metrics', metricsRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy!' });
});
exports.default = app;
