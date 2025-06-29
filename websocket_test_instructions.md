# WebSocket Testing Instructions

## Connection Details
- **WebSocket URL**: `ws://localhost:5000`
- **Protocol**: Socket.IO

## Testing with JavaScript (Browser Console)

```javascript
// Connect to WebSocket
const socket = io('http://localhost:5000');

// Listen for initial token data
socket.on('initialTokens', (data) => {
  console.log('Initial tokens received:', data);
});

// Listen for live updates (every 5 seconds)
socket.on('tokenUpdates', (update) => {
  console.log('Live update received:', update);
  console.log('Timestamp:', new Date(update.timestamp));
  console.log('Token count:', update.data.tokens?.length || 0);
});

// Listen for errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Listen for connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

## Testing with Node.js

```javascript
const { io } = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('initialTokens', (data) => {
  console.log('Initial tokens:', data);
});

socket.on('tokenUpdates', (update) => {
  console.log('Live update:', update);
});

socket.on('connect', () => {
  console.log('Connected!');
});
```

## Testing with Postman

1. Open Postman
2. Go to "New" → "WebSocket Request"
3. Enter URL: `ws://localhost:5000`
4. Click "Connect"
5. You should receive initial token data immediately
6. Live updates will be pushed every 5 seconds

## Expected Events

### Initial Connection
- Event: `initialTokens`
- Data: Complete token list with current prices and volumes

### Live Updates
- Event: `tokenUpdates`
- Data: Updated token list with timestamp
- Frequency: Every 5 seconds

### Error Handling
- Event: `error`
- Data: Error message if data fetching fails

## Notes
- The server fetches fresh data from DEX APIs every 5 seconds
- Updates are broadcasted to all connected clients
- Redis caching is used to minimize API calls
- Multiple clients can connect simultaneously 