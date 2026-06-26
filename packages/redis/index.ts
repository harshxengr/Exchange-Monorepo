import { Redis } from 'ioredis';
import { env } from '@exchange/env';

export const createRedisClient = () => {
  const client = new Redis(env.REDIS_URL);

  client.on('error', (err) => console.error('Redis Client Error', err));
  client.on('connect', () => console.log('Connected to Redis Successfully'));

  return client;
};

export const REDIS_QUEUES = {
  ORDER_INFLOW: 'exchange:order:inflow',
  ACCOUNT_INIT: 'exchange:account:init'
};

export const REDIS_CHANNELS = {
  ORDER_UPDATES: 'exchange:order:updates',
  MARKET_DATA: 'exchange:market:data'
};