"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socketServer_1 = require("../src/websocket/socketServer");
const subscriptionManager_1 = require("../src/websocket/subscriptionManager");
const express_1 = __importDefault(require("express"));
describe('WebSocket subscriptions', () => {
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
    beforeEach(() => {
        // Clear subscriptions before each test
        const allSubscribers = subscriptionManager_1.subscriptionManager.getAllSubscribers();
        allSubscribers.forEach(socketId => {
            subscriptionManager_1.subscriptionManager.unsubscribe(socketId);
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
        const subscription = subscriptionManager_1.subscriptionManager.getSubscription('test-socket-1');
        expect(subscription).toBeDefined();
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.time).toBe('24h');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.sort).toBe('volume');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.limit).toBe(50);
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
        const subscription = subscriptionManager_1.subscriptionManager.getSubscription('test-socket-2');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.time).toBe('1h');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.sort).toBe('priceChange');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.limit).toBe(20);
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
        const subscription = subscriptionManager_1.subscriptionManager.getSubscription('test-socket-3');
        expect(subscription === null || subscription === void 0 ? void 0 : subscription.filters.tokens).toEqual(tokenAddresses);
    });
    it('unsubscribes client on disconnect', () => {
        const mockSocket = {
            id: 'test-socket-4',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        expect(subscriptionManager_1.subscriptionManager.getSubscription('test-socket-4')).toBeDefined();
        // Simulate disconnect
        mockSocket.on.mock.calls.forEach(([event, callback]) => {
            if (event === 'disconnect') {
                callback('client disconnect');
            }
        });
        expect(subscriptionManager_1.subscriptionManager.getSubscription('test-socket-4')).toBeUndefined();
    });
    it('gets subscribers for specific tokens', () => {
        // Create multiple subscriptions
        subscriptionManager_1.subscriptionManager.subscribe('client1', { tokens: ['0x123', '0x456'] });
        subscriptionManager_1.subscriptionManager.subscribe('client2', { tokens: ['0x123'] });
        subscriptionManager_1.subscriptionManager.subscribe('client3', {}); // No specific tokens
        const subscribersForToken123 = subscriptionManager_1.subscriptionManager.getSubscribersForToken('0x123');
        expect(subscribersForToken123).toContain('client1');
        expect(subscribersForToken123).toContain('client2');
        expect(subscribersForToken123).toContain('client3'); // No specific tokens means all tokens
        const subscribersForToken456 = subscriptionManager_1.subscriptionManager.getSubscribersForToken('0x456');
        expect(subscribersForToken456).toContain('client1');
        expect(subscribersForToken456).toContain('client3');
        expect(subscribersForToken456).not.toContain('client2');
    });
    it('provides subscription statistics', () => {
        subscriptionManager_1.subscriptionManager.subscribe('client1', { time: '1h' });
        subscriptionManager_1.subscriptionManager.subscribe('client2', { time: '24h' });
        const stats = socketServer.getSubscriptionStats();
        expect(stats.totalSubscribers).toBe(2);
        expect(stats.activeClients).toBeDefined();
    });
});
//# sourceMappingURL=websocketSubscriptions.test.js.map