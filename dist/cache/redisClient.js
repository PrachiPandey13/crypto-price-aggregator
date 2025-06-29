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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokenCache = setTokenCache;
exports.getTokenCache = getTokenCache;
const ioredis_1 = __importDefault(require("ioredis"));
// Load Redis URL from environment variables
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Log after redisUrl is defined
console.log('Connecting to Redis at:', redisUrl);
// Initialize Redis client
const redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: 3,
});
redis.on('connect', () => {
    console.log('Connected to Redis');
});
redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});
redis.on('ready', () => {
    console.log('Redis is ready');
});
function setTokenCache(key_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (key, value, ttlSeconds = 30) {
        try {
            yield redis.setex(key, ttlSeconds, value);
            console.log(`Cached data for key: ${key} with TTL: ${ttlSeconds}s`);
        }
        catch (error) {
            console.error('Error setting cache:', error);
        }
    });
}
function getTokenCache(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const value = yield redis.get(key);
            if (value) {
                console.log(`Cache HIT for key: ${key}`);
            }
            else {
                console.log(`Cache MISS for key: ${key}`);
            }
            return value;
        }
        catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    });
}
exports.default = redis;
