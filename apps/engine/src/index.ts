import { createRedisClient, REDIS_QUEUES, REDIS_CHANNELS } from '@exchange/redis';
import { Orderbook } from './Orderbook';
import { Order } from '@exchange/types';

const redisConsumer = createRedisClient();
const redisPublisher = createRedisClient();

const btcOrderbook = new Orderbook('BTC', 'USD');

btcOrderbook.deposit('user_alice', 'USD', 100000);
btcOrderbook.deposit('user_bob', 'BTC', 2);

console.log('Matching Engine Worker Running Core Loop...');

async function startEngineLoop() {
    while (true) {
        try {
            const data = await redisConsumer.blpop(REDIS_QUEUES.ORDER_INFLOW, 0);
            if (!data) continue;

            const [_queueName, rawOrderMessage] = data;
            const order: Order = JSON.parse(rawOrderMessage);

            console.log(`Processing incoming ${order.side} order from ${order.userId}`);

            try {
                const result = btcOrderbook.processOrder(order);

                await redisPublisher.publish(
                    REDIS_CHANNELS.ORDER_UPDATES,
                    JSON.stringify({ orderId: order.id, ...result })
                );

                await redisPublisher.publish(
                    REDIS_CHANNELS.MARKET_DATA,
                    JSON.stringify({ pair: 'BTC_USD', depth: btcOrderbook.getDepth() })
                );

            } catch (err: any) {
                console.error(`Order execution validation failed: ${err.message}`);
            }

        } catch (loopError) {
            console.error('Critical Engine Core loop system crash error:', loopError);
        }
    }
}

startEngineLoop();