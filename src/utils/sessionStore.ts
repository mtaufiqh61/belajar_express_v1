import { Redis } from 'ioredis';

export const redis = new Redis({
  retryStrategy(times) {
    const delay = Math.min(times * 1000, 5000);
    return times > 5 ? null : delay; // null berarti berhenti mencoba
  },
  port: 6379,
  host: 'cache',
  password: process.env.REDIS_PASSWORD
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis ready');
});

export const sessions = {};