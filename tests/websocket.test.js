"use strict";
const { Server } = require('http');
const { io: ClientIO } = require('socket.io-client');
const { SocketServer } = require('../src/websocket/socketServer');
const express = require('express');

describe('WebSocket live updates', () => {
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
    it('receives initialTokens and tokenUpdates events', (done) => {
        let receivedInitial = false;
        clientSocket.on('initialTokens', (data) => {
            expect(data).toBeDefined();
            receivedInitial = true;
        });
        clientSocket.on('tokenUpdates', (update) => {
            expect(update).toHaveProperty('timestamp');
            expect(update).toHaveProperty('data');
            if (receivedInitial)
                done();
        });
    });
});
//# sourceMappingURL=websocket.test.js.map