// src/services/clients/redis-client.ts

import Redis from 'ioredis';
import { logger } from '../logger';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL, {
  // Optional configurations
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// Handle Redis events
redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.error(`Redis error: ${error.message}`);
});

redis.on('ready', () => {
  logger.info('Redis is ready to use');
});

export default redis;
