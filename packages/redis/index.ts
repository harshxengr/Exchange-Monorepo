import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const createRedisClient = () => {
  const client = new Redis(REDIS_URL);
  
  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Connected to Redis Successfully'));
  
  return client;
};

// Common queue & channel definitions
export const REDIS_QUEUES = {
  ORDER_INFLOW: 'exchange:order:inflow'
};

export const REDIS_CHANNELS = {
  ORDER_UPDATES: 'exchange:order:updates',
  MARKET_DATA: 'exchange:market:data'
};