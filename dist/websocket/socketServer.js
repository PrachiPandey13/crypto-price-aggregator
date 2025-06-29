"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const socket_io_1 = require("socket.io");
const tokenService_1 = require("../services/tokenService");
const redisClient_1 = require("../cache/redisClient");
const subscriptionManager_1 = require("./subscriptionManager");
class SocketServer {
    constructor(httpServer) {
        this.updateInterval = null;
        this.heartbeatInterval = null;
        this.lastTokenData = null;
        this.clientHeartbeats = new Map();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            pingTimeout: 35000, // 35 seconds timeout
            pingInterval: 30000 // 30 seconds ping interval
        });
        this.setupEventHandlers();
        this.startLiveUpdates();
        this.startHeartbeat();
    }
    logActiveClients() {
        const clientCount = this.io.engine.clientsCount;
        console.log(`Active WebSocket clients: ${clientCount}`);
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Client connected: ${socket.id}`);
            this.logActiveClients();
            // Initialize client heartbeat tracking
            this.clientHeartbeats.set(socket.id, {
                lastPong: Date.now(),
                isAlive: true
            });
            // Default subscription for all clients
            subscriptionManager_1.subscriptionManager.subscribe(socket.id, {
                time: '24h',
                sort: 'volume',
                limit: 50
            });
            // Push initial token data on connection
            try {
                // First try to get cached data for immediate response
                const cacheKey = 'tokens:24h:volume:50:';
                const cached = yield (0, redisClient_1.getTokenCache)(cacheKey);
                if (cached && this.lastTokenData) {
                    // Send cached data immediately for faster response
                    socket.emit('initialTokens', this.lastTokenData);
                    console.log(`Sent cached data to client: ${socket.id}`);
                }
                else {
                    // Fetch fresh data if no cache available
                    const initialData = yield (0, tokenService_1.fetchAndAggregateTokens)({
                        time: '24h',
                        sort: 'volume',
                        limit: 50
                    });
                    this.lastTokenData = initialData;
                    socket.emit('initialTokens', initialData);
                    console.log(`Sent fresh data to client: ${socket.id}`);
                }
            }
            catch (error) {
                console.error(`Error fetching initial tokens for client ${socket.id}:`, error);
                socket.emit('error', { message: 'Failed to fetch initial data' });
            }
            // Handle pong responses
            socket.on('pong', () => {
                const clientInfo = this.clientHeartbeats.get(socket.id);
                if (clientInfo) {
                    clientInfo.lastPong = Date.now();
                    clientInfo.isAlive = true;
                    console.log(`Received pong from client: ${socket.id}`);
                }
            });
            // Handle subscription updates
            socket.on('subscribe', (filters) => {
                subscriptionManager_1.subscriptionManager.subscribe(socket.id, filters);
                socket.emit('subscriptionConfirmed', { filters });
            });
            // Handle specific token subscriptions
            socket.on('subscribeToTokens', (tokenAddresses) => {
                const currentSubscription = subscriptionManager_1.subscriptionManager.getSubscription(socket.id);
                const updatedFilters = Object.assign(Object.assign({}, currentSubscription === null || currentSubscription === void 0 ? void 0 : currentSubscription.filters), { tokens: tokenAddresses });
                subscriptionManager_1.subscriptionManager.subscribe(socket.id, updatedFilters);
                socket.emit('tokenSubscriptionConfirmed', { tokens: tokenAddresses });
            });
            // Handle filter updates
            socket.on('updateFilters', (filters) => {
                const currentSubscription = subscriptionManager_1.subscriptionManager.getSubscription(socket.id);
                const updatedFilters = Object.assign(Object.assign({}, currentSubscription === null || currentSubscription === void 0 ? void 0 : currentSubscription.filters), filters);
                subscriptionManager_1.subscriptionManager.subscribe(socket.id, updatedFilters);
                socket.emit('filtersUpdated', { filters: updatedFilters });
            });
            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
                subscriptionManager_1.subscriptionManager.unsubscribe(socket.id);
                this.clientHeartbeats.delete(socket.id);
                this.logActiveClients();
            });
        }));
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeoutThreshold = 35000; // 35 seconds
            // Check all clients for responsiveness
            for (const [socketId, clientInfo] of this.clientHeartbeats) {
                const timeSinceLastPong = now - clientInfo.lastPong;
                if (timeSinceLastPong > timeoutThreshold) {
                    console.log(`Disconnecting unresponsive client: ${socketId} (no pong for ${timeSinceLastPong}ms)`);
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect(true);
                    }
                    this.clientHeartbeats.delete(socketId);
                    subscriptionManager_1.subscriptionManager.unsubscribe(socketId);
                }
                else {
                    // Send ping to responsive clients
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit('ping');
                        console.log(`Sent ping to client: ${socketId}`);
                    }
                }
            }
            console.log(`Heartbeat check completed. Active clients: ${this.clientHeartbeats.size}`);
        }, 30000); // Check every 30 seconds
    }
    startLiveUpdates() {
        this.updateInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedData = yield (0, tokenService_1.fetchAndAggregateTokens)({
                    time: '24h',
                    sort: 'volume',
                    limit: 50
                });
                // Store the latest data for reconnecting clients
                this.lastTokenData = updatedData;
                // Get subscribers for this update
                const subscribers = subscriptionManager_1.subscriptionManager.getSubscribersForFilters({
                    time: '24h',
                    sort: 'volume',
                    limit: 50
                });
                // Send targeted updates to subscribed clients
                subscribers.forEach(socketId => {
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit('tokenUpdates', {
                            timestamp: Date.now(),
                            data: updatedData
                        });
                    }
                });
                // Send specific token updates
                if (updatedData.tokens) {
                    updatedData.tokens.forEach((token) => {
                        const tokenSubscribers = subscriptionManager_1.subscriptionManager.getSubscribersForToken(token.address);
                        tokenSubscribers.forEach(socketId => {
                            const socket = this.io.sockets.sockets.get(socketId);
                            if (socket) {
                                socket.emit('tokenUpdate', {
                                    timestamp: Date.now(),
                                    token: token
                                });
                            }
                        });
                    });
                }
                console.log(`Sent updates to ${subscribers.length} subscribed clients`);
            }
            catch (error) {
                console.error('Error in live updates:', error);
            }
        }), 5000); // Update every 5 seconds
    }
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    getIO() {
        return this.io;
    }
    getSubscriptionStats() {
        return {
            totalSubscribers: subscriptionManager_1.subscriptionManager.getSubscriptionCount(),
            activeClients: this.io.engine.clientsCount,
            responsiveClients: this.clientHeartbeats.size
        };
    }
    getHeartbeatStats() {
        const now = Date.now();
        const stats = {
            totalClients: this.clientHeartbeats.size,
            responsiveClients: 0,
            unresponsiveClients: 0,
            averageResponseTime: 0
        };
        let totalResponseTime = 0;
        let responsiveCount = 0;
        for (const [socketId, clientInfo] of this.clientHeartbeats) {
            const timeSinceLastPong = now - clientInfo.lastPong;
            if (timeSinceLastPong < 35000) {
                stats.responsiveClients++;
                totalResponseTime += timeSinceLastPong;
                responsiveCount++;
            }
            else {
                stats.unresponsiveClients++;
            }
        }
        if (responsiveCount > 0) {
            stats.averageResponseTime = totalResponseTime / responsiveCount;
        }
        return stats;
    }
}
exports.SocketServer = SocketServer;
