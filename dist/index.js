"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Main entry point for the Real-Time Data Aggregation Service
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socketServer_1 = require("./websocket/socketServer");
const PORT = process.env.PORT || 5000;
const server = (0, http_1.createServer)(app_1.default);
// Initialize WebSocket server
const socketServer = new socketServer_1.SocketServer(server);
// Make socket server available to the app for metrics
app_1.default.socketServer = socketServer;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map