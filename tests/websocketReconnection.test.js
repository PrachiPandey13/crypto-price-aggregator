"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socketServer_1 = require("../src/websocket/socketServer");
const express_1 = __importDefault(require("express"));
describe('WebSocket reconnection', () => {
    let httpServer;
    let socketServer;
    let clientSocket;
    beforeAll((done) => {
        const app = (0, express_1.default)();
        httpServer = app.listen(0, () => {
            socketServer = new socketServer_1.SocketServer(httpServer);
            const port = httpServer.address().port;
            clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
    });
    afterAll(() => {
        clientSocket.close();
        httpServer.close();
    });
    it('receives initial data on connection', (done) => {
        clientSocket.on('initialTokens', (data) => {
            expect(data).toBeDefined();
            expect(data).toHaveProperty('tokens');
            done();
        });
    });
    it('receives live updates after connection', (done) => {
        let updateCount = 0;
        clientSocket.on('tokenUpdates', (update) => {
            expect(update).toHaveProperty('timestamp');
            expect(update).toHaveProperty('data');
            updateCount++;
            if (updateCount >= 2)
                done(); // Wait for at least 2 updates
        });
    });
    it('receives cached data on reconnection', (done) => {
        // Disconnect and reconnect
        clientSocket.disconnect();
        setTimeout(() => {
            clientSocket.connect();
            clientSocket.on('initialTokens', (data) => {
                expect(data).toBeDefined();
                done();
            });
        }, 100);
    });
});
//# sourceMappingURL=websocketReconnection.test.js.map