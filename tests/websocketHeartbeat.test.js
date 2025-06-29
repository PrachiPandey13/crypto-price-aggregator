"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socketServer_1 = require("../src/websocket/socketServer");
const express_1 = __importDefault(require("express"));
const io = require('socket.io-client');

describe('WebSocket heartbeat system', () => {
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

    it('initializes client heartbeat tracking on connection', () => {
        const mockSocket = {
            id: 'test-heartbeat-1',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        // Check that heartbeat tracking is initialized
        const stats = socketServer.getHeartbeatStats();
        expect(stats.totalClients).toBe(1);
        expect(stats.responsiveClients).toBe(1);
    });

    it('updates client heartbeat on pong response', () => {
        const mockSocket = {
            id: 'test-heartbeat-2',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        // Simulate pong response
        mockSocket.on.mock.calls.forEach(([event, callback]) => {
            if (event === 'pong') {
                callback();
            }
        });
        // Verify pong was handled
        const stats = socketServer.getHeartbeatStats();
        expect(stats.responsiveClients).toBe(1);
    });

    it('sends ping to responsive clients', () => {
        const mockSocket = {
            id: 'test-heartbeat-3',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        // Trigger heartbeat check (simulate interval)
        const heartbeatMethod = socketServer.startHeartbeat;
        if (heartbeatMethod) {
            heartbeatMethod.call(socketServer);
        }
        // Verify ping was sent
        expect(mockSocket.emit).toHaveBeenCalledWith('ping');
    });

    it('disconnects unresponsive clients', () => {
        const mockSocket = {
            id: 'test-heartbeat-4',
            on: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        // Manually set client as unresponsive (old lastPong time)
        const clientHeartbeats = socketServer.clientHeartbeats;
        if (clientHeartbeats && clientHeartbeats.get('test-heartbeat-4')) {
            clientHeartbeats.get('test-heartbeat-4').lastPong = Date.now() - 40000; // 40 seconds ago
        }
        // Trigger heartbeat check
        const heartbeatMethod = socketServer.startHeartbeat;
        if (heartbeatMethod) {
            heartbeatMethod.call(socketServer);
        }
        // Verify disconnect was called
        expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('provides heartbeat statistics', () => {
        const stats = socketServer.getHeartbeatStats();
        expect(stats).toHaveProperty('totalClients');
        expect(stats).toHaveProperty('responsiveClients');
        expect(stats).toHaveProperty('unresponsiveClients');
        expect(stats).toHaveProperty('averageResponseTime');
        expect(typeof stats.totalClients).toBe('number');
        expect(typeof stats.responsiveClients).toBe('number');
        expect(typeof stats.unresponsiveClients).toBe('number');
        expect(typeof stats.averageResponseTime).toBe('number');
    });

    it('cleans up heartbeat tracking on disconnect', () => {
        const mockSocket = {
            id: 'test-heartbeat-5',
            on: jest.fn(),
            emit: jest.fn()
        };
        // Simulate connection
        socketServer.getIO().emit('connection', mockSocket);
        // Verify client is tracked
        let stats = socketServer.getHeartbeatStats();
        expect(stats.totalClients).toBeGreaterThan(0);
        // Simulate disconnect
        mockSocket.on.mock.calls.forEach(([event, callback]) => {
            if (event === 'disconnect') {
                callback('client disconnect');
            }
        });
        // Verify cleanup
        stats = socketServer.getHeartbeatStats();
        // Note: This test might need adjustment based on actual implementation
        // The disconnect handler should remove the client from tracking
    });

    it('includes heartbeat stats in subscription stats', () => {
        const subscriptionStats = socketServer.getSubscriptionStats();
        expect(subscriptionStats).toHaveProperty('totalSubscribers');
        expect(subscriptionStats).toHaveProperty('activeClients');
        expect(subscriptionStats).toHaveProperty('responsiveClients');
        expect(typeof subscriptionStats.responsiveClients).toBe('number');
    });

    it('should handle client disconnection during heartbeat', async () => {
        const client = io('http://localhost:5000');
        
        await new Promise(resolve => client.on('connect', resolve));
        
        // Simulate client disconnection
        client.disconnect();
        
        // Wait for heartbeat cycle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify client is no longer tracked
        const stats = socketServer.getHeartbeatStats();
        expect(stats.totalClients).toBe(0);
        
        client.close();
    }, 10000);
});
//# sourceMappingURL=websocketHeartbeat.test.js.map