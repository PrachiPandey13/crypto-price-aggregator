# Real-Time Data Aggregation Service

## Project Overview
This service aggregates real-time token data from multiple decentralized exchanges (DEXs) and provides both REST API and WebSocket endpoints for clients to access live token information. It supports advanced filtering, sorting, and cursor-based pagination, and is optimized for high-frequency updates and efficient caching.

## Tech Stack
- **Node.js** (TypeScript)
- **Express** (REST API)
- **Socket.IO** (WebSocket real-time updates)
- **ioredis** (Redis caching)
- **Axios** (HTTP requests)
- **node-cron** (Scheduled tasks)
- **Jest** (Testing)
- **Supertest** (API integration testing)
- **Postman** (API documentation & testing)
- **Docker** (Containerization)
- **Railway** (Deployment platform)

## How to Run Locally
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Real-Time-Data-Aggregation-Service
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start Redis** (make sure Redis is running locally or update the connection string in `src/cache/redisClient.ts`)
4. **Run the development server**
   ```bash
   npm run dev
   ```
   Or build and run:
   ```bash
   npm run build
   npm start
   ```
5. **Run tests**
   ```bash
   npm test
   ```

## API Endpoints
### REST API
- `GET /api/tokens` — Get aggregated token data
  - **Query Parameters:**
    - `time`: `1h`, `24h`, `7d` (default: `24h`)
    - `sort`: `volume`, `priceChange`, `marketCap` (default: `volume`)
    - `limit`: Number of results (default: `20`, max: `100`)
    - `nextCursor`: Token address for pagination
- `GET /api/metrics` — Get system metrics (response times, cache hit rates, WebSocket stats)
- `GET /` — Health check

### WebSocket
- **URL:** `ws://localhost:5000` (Socket.IO protocol)
- **Events:**
  - `initialTokens`: Sent on connection with the current token list
  - `tokenUpdates`: Sent every 5 seconds with live updates
  - `ping`/`pong`: Heartbeat mechanism for connection health

#### Example (Browser Console)
```js
const socket = io('http://localhost:5000');
socket.on('initialTokens', data => console.log(data));
socket.on('tokenUpdates', update => console.log(update));
```

## Caching, Rate Limiting, and WebSocket Flow
- **Caching:**
  - Multi-layer caching: Memory cache (5s TTL) → Redis cache (30s TTL) → API calls
  - Aggregated token lists are cached in Redis for 30 seconds (configurable) to minimize API calls and improve response times.
  - Cache keys are based on query parameters (time, sort, limit, cursor).
- **Rate Limiting:**
  - API requests to DEXs (DexScreener, GeckoTerminal) use exponential backoff with jitter on HTTP 429 (rate limit) errors.
  - Retries are performed with increasing wait times and random jitter to avoid thundering herd problems.
- **WebSocket Flow:**
  - On client connection, the latest token data is sent immediately.
  - Every 5 seconds, a cron job fetches fresh data and broadcasts updates to all connected clients.
  - Multiple clients are supported and all receive the same live updates.
  - Heartbeat mechanism ensures connection health and disconnects unresponsive clients.

## Deployment

### Railway Deployment (Recommended)

This project is configured for easy deployment on Railway. See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

#### Quick Deploy:
1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   ./deploy.sh
   ```

3. **Add Redis Service:**
   - In Railway dashboard, add a Redis database service
   - Set `REDIS_URL` environment variable

#### Environment Variables:
- `REDIS_URL`: Redis connection string (provided by Railway)
- `PORT`: Application port (auto-set by Railway)
- `NODE_ENV`: Environment (`production`)

### Other Deployment Options
- **Heroku**: Use the provided Dockerfile
- **AWS**: Deploy using ECS or EC2
- **DigitalOcean**: Use App Platform or Droplets
- **Vercel**: For serverless deployment (limited WebSocket support)

## Postman Collection
- [Download Postman Collection](./postman_collection.json)
  - Import this file into Postman to test all API endpoints and query parameters.

## Testing
Run the comprehensive test suite:
## Design Decisions
- **TypeScript:** Ensures type safety and maintainability for a growing codebase.
- **Express & Socket.IO:** Chosen for their maturity and ecosystem support for both REST and real-time APIs.
- **Redis Caching:** Reduces load on third-party APIs and improves response times for frequent queries.
- **Exponential Backoff:** Handles rate limits gracefully, ensuring reliability even under heavy usage.
- **Modular Structure:** Code is organized into controllers, services, routes, utils, cache, and websocket for clarity and scalability.
- **Cursor-Based Pagination:** Enables efficient navigation through large token lists without performance bottlenecks.
- **Comprehensive Testing:** Unit and integration tests cover all critical logic, including API, caching, merging, sorting, pagination, and error handling.
- **Postman & WebSocket Docs:** Included for easy onboarding and testing by developers and integrators.

---

For any questions or contributions, please open an issue or pull request! 