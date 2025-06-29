"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionManager = void 0;
class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
    }
    subscribe(socketId, filters) {
        this.subscriptions.set(socketId, { socketId, filters });
        console.log(`Client ${socketId} subscribed with filters:`, filters);
    }
    unsubscribe(socketId) {
        this.subscriptions.delete(socketId);
        console.log(`Client ${socketId} unsubscribed`);
    }
    getSubscribersForToken(tokenAddress) {
        const subscribers = [];
        for (const [socketId, subscription] of this.subscriptions) {
            if (!subscription.filters.tokens || subscription.filters.tokens.includes(tokenAddress)) {
                subscribers.push(socketId);
            }
        }
        return subscribers;
    }
    getSubscribersForFilters(filters) {
        const subscribers = [];
        for (const [socketId, subscription] of this.subscriptions) {
            if (this.matchesFilters(subscription.filters, filters)) {
                subscribers.push(socketId);
            }
        }
        return subscribers;
    }
    matchesFilters(subscriptionFilters, updateFilters) {
        // Check if time periods match
        if (subscriptionFilters.time && updateFilters.time && subscriptionFilters.time !== updateFilters.time) {
            return false;
        }
        // Check if sort criteria match
        if (subscriptionFilters.sort && updateFilters.sort && subscriptionFilters.sort !== updateFilters.sort) {
            return false;
        }
        // Check if limit matches (within range)
        if (subscriptionFilters.limit && updateFilters.limit && updateFilters.limit > subscriptionFilters.limit) {
            return false;
        }
        return true;
    }
    getAllSubscribers() {
        return Array.from(this.subscriptions.keys());
    }
    getSubscriptionCount() {
        return this.subscriptions.size;
    }
    getSubscription(socketId) {
        return this.subscriptions.get(socketId);
    }
}
exports.subscriptionManager = new SubscriptionManager();
