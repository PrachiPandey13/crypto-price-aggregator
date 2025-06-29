"use strict";
const { Server } = require('http');
const { io: ClientIO } = require('socket.io-client');
const { SocketServer } = require('../src/websocket/socketServer');
const express = require('express');

describe('WebSocket reconnection', () => {
    let httpServer;
    let socketServer;
    let clientSocket;
    beforeAll((done) => {
        const app = express();
        httpServer = app.listen(0, () => {
            socketServer = new SocketServer(httpServer);
            const port = httpServer.address().port;
            clientSocket = ClientIO(`http://localhost:${port}`);
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