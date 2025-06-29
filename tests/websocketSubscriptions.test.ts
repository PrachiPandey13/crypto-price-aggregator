import { Server } from 'http';
import { SocketServer } from '../src/websocket/socketServer';
import { subscriptionManager } from '../src/websocket/subscriptionManager';
import express from 'express';

describe('WebSocket subscriptions', () => {
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

  beforeEach(() => {
    // Clear subscriptions before each test
    const allSubscribers = subscriptionManager.getAllSubscribers();
    allSubscribers.forEach(socketId => {
      subscriptionManager.unsubscribe(socketId);
    });
  });

  it('subscribes client with default filters on connection', () => {
    const mockSocket = {
      id: 'test-socket-1',
      on: jest.fn(),
      emit: jest.fn()
    };

    // Simulate connection
    socketServer.getIO().emit('connection', mockSocket);

    const subscription = subscriptionManager.getSubscription('test-socket-1');
    expect(subscription).toBeDefined();
    expect(subscription?.filters.time).toBe('24h');
    expect(subscription?.filters.sort).toBe('volume');
    expect(subscription?.filters.limit).toBe(50);
  });

  it('handles subscription updates', () => {
    const mockSocket = {
      id: 'test-socket-2',
      on: jest.fn(),
      emit: jest.fn()
    };

    // Simulate connection
    socketServer.getIO().emit('connection', mockSocket);

    // Simulate subscription update
    const newFilters = { time: '1h', sort: 'priceChange', limit: 20 };
    mockSocket.on.mock.calls.forEach(([event, callback]) => {
      if (event === 'subscribe') {
        callback(newFilters);
      }
    });

    const subscription = subscriptionManager.getSubscription('test-socket-2');
    expect(subscription?.filters.time).toBe('1h');
    expect(subscription?.filters.sort).toBe('priceChange');
    expect(subscription?.filters.limit).toBe(20);
  });

  it('handles token-specific subscriptions', () => {
    const mockSocket = {
      id: 'test-socket-3',
      on: jest.fn(),
      emit: jest.fn()
    };

    // Simulate connection
    socketServer.getIO().emit('connection', mockSocket);

    // Simulate token subscription
    const tokenAddresses = ['0x123', '0x456'];
    mockSocket.on.mock.calls.forEach(([event, callback]) => {
      if (event === 'subscribeToTokens') {
        callback(tokenAddresses);
      }
    });

    const subscription = subscriptionManager.getSubscription('test-socket-3');
    expect(subscription?.filters.tokens).toEqual(tokenAddresses);
  });

  it('unsubscribes client on disconnect', () => {
    const mockSocket = {
      id: 'test-socket-4',
      on: jest.fn(),
      emit: jest.fn()
    };

    // Simulate connection
    socketServer.getIO().emit('connection', mockSocket);
    expect(subscriptionManager.getSubscription('test-socket-4')).toBeDefined();

    // Simulate disconnect
    mockSocket.on.mock.calls.forEach(([event, callback]) => {
      if (event === 'disconnect') {
        callback('client disconnect');
      }
    });

    expect(subscriptionManager.getSubscription('test-socket-4')).toBeUndefined();
  });

  it('gets subscribers for specific tokens', () => {
    // Create multiple subscriptions
    subscriptionManager.subscribe('client1', { tokens: ['0x123', '0x456'] });
    subscriptionManager.subscribe('client2', { tokens: ['0x123'] });
    subscriptionManager.subscribe('client3', {}); // No specific tokens

    const subscribersForToken123 = subscriptionManager.getSubscribersForToken('0x123');
    expect(subscribersForToken123).toContain('client1');
    expect(subscribersForToken123).toContain('client2');
    expect(subscribersForToken123).toContain('client3'); // No specific tokens means all tokens

    const subscribersForToken456 = subscriptionManager.getSubscribersForToken('0x456');
    expect(subscribersForToken456).toContain('client1');
    expect(subscribersForToken456).toContain('client3');
    expect(subscribersForToken456).not.toContain('client2');
  });

  it('provides subscription statistics', () => {
    subscriptionManager.subscribe('client1', { time: '1h' });
    subscriptionManager.subscribe('client2', { time: '24h' });

    const stats = socketServer.getSubscriptionStats();
    expect(stats.totalSubscribers).toBe(2);
    expect(stats.activeClients).toBeDefined();
  });
}); 