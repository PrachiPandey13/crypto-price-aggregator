interface Subscription {
  socketId: string;
  filters: {
    time?: '1h' | '24h' | '7d';
    sort?: string;
    limit?: number;
    tokens?: string[]; // specific token addresses
  };
}

class SubscriptionManager {
  private subscriptions = new Map<string, Subscription>();

  subscribe(socketId: string, filters: Subscription['filters']): void {
    this.subscriptions.set(socketId, { socketId, filters });
    console.log(`Client ${socketId} subscribed with filters:`, filters);
  }

  unsubscribe(socketId: string): void {
    this.subscriptions.delete(socketId);
    console.log(`Client ${socketId} unsubscribed`);
  }

  getSubscribersForToken(tokenAddress: string): string[] {
    const subscribers: string[] = [];
    
    for (const [socketId, subscription] of this.subscriptions) {
      if (!subscription.filters.tokens || subscription.filters.tokens.includes(tokenAddress)) {
        subscribers.push(socketId);
      }
    }
    
    return subscribers;
  }

  getSubscribersForFilters(filters: Subscription['filters']): string[] {
    const subscribers: string[] = [];
    
    for (const [socketId, subscription] of this.subscriptions) {
      if (this.matchesFilters(subscription.filters, filters)) {
        subscribers.push(socketId);
      }
    }
    
    return subscribers;
  }

  private matchesFilters(subscriptionFilters: Subscription['filters'], updateFilters: Subscription['filters']): boolean {
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

  getAllSubscribers(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getSubscription(socketId: string): Subscription | undefined {
    return this.subscriptions.get(socketId);
  }
}

export const subscriptionManager = new SubscriptionManager(); 