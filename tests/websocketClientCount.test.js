"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socketServer_1 = require("../src/websocket/socketServer");
const express_1 = __importDefault(require("express"));
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
describe('WebSocket client count logging', () => {
    let httpServer;
    let socketServer;
    beforeAll((done) => {
        const app = (0, express_1.default)();
        httpServer = app.listen(0, () => {
            socketServer = new socketServer_1.SocketServer(httpServer);
            done();
        });
    });
    afterAll(() => {
        httpServer.close();
    });
    it('logs client count on connection', (done) => {
        // Simulate a client connection
        const mockSocket = {
            id: 'test-socket-id',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Trigger the connection event
        socketServer.getIO().emit('connection', mockSocket);
        setTimeout(() => {
            expect(logMessages.some(msg => msg.includes('Active WebSocket clients:'))).toBe(true);
            done();
        }, 100);
    });
    it('logs client count on disconnection', (done) => {
        // Simulate a client disconnection
        const mockSocket = {
            id: 'test-socket-id-2',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Trigger the connection event first
        socketServer.getIO().emit('connection', mockSocket);
        setTimeout(() => {
            // Trigger disconnect event
            mockSocket.on.mock.calls.forEach(([event, callback]) => {
                if (event === 'disconnect') {
                    callback('client disconnect');
                }
            });
            setTimeout(() => {
                expect(logMessages.some(msg => msg.includes('Active WebSocket clients:'))).toBe(true);
                done();
            }, 100);
        }, 100);
    });
});
//# sourceMappingURL=websocketClientCount.test.js.map