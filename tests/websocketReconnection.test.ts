import { Server } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { SocketServer } from '../src/websocket/socketServer';
import express from 'express';

describe('WebSocket reconnection', () => {
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
      if (updateCount >= 2) done(); // Wait for at least 2 updates
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