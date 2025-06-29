import { Server } from 'http';
import { SocketServer } from '../src/websocket/socketServer';
import express from 'express';

// Mock console.log to capture log messages
const originalConsoleLog = console.log;
let logMessages: string[] = [];

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
  let httpServer: Server;
  let socketServer: SocketServer;

  beforeAll((done) => {
    const app = express();
    httpServer = app.listen(0, () => {
      socketServer = new SocketServer(httpServer);
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