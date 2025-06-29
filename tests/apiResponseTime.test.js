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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages = [];
beforeEach(() => {
    logMessages = [];
    console.log = jest.fn((...args) => {
        logMessages.push(args.join(' '));
        originalConsoleLog(...args);
    });
});
afterEach(() => {
    console.log = originalConsoleLog;
});
describe('API response time logging', () => {
    it('logs response time for successful requests', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).get('/api/tokens');
        expect(res.status).toBe(200);
        expect(logMessages.some(msg => msg.includes('GET /api/tokens served in') && msg.includes('ms'))).toBe(true);
    }));
    it('logs response time for requests with query parameters', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).get('/api/tokens?time=1h&sort=volume&limit=10');
        expect(res.status).toBe(200);
        expect(logMessages.some(msg => msg.includes('GET /api/tokens served in') && msg.includes('ms'))).toBe(true);
    }));
    it('logs response time for health check endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    }));
});
//# sourceMappingURL=apiResponseTime.test.js.map