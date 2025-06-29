import { Server } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { SocketServer } from '../src/websocket/socketServer';
import express from 'express';

describe('WebSocket live updates', () => {
  let httpServer: Server;
  let socketServer: SocketServer;
  let clientSocket: ClientSocket;

  beforeAll((done) => {
    const app = express();
    httpServer = app.listen(0, () => {
      socketServer = new SocketServer(httpServer);
      const port = (httpServer.address() as any).port;
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
      if (receivedInitial) done();
    });
  });
}); 