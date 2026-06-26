import { prisma } from '@exchange/db';
import { createRedisClient, REDIS_QUEUES, REDIS_CHANNELS } from '@exchange/redis';
import { Orderbook } from './Orderbook';
import { AccountInitialization, Order } from '@exchange/types';

const redisConsumer = createRedisClient();
const redisPublisher = createRedisClient();

const solOrderbook = new Orderbook('SOL', 'USDC');

const STARTER_TRADING_BALANCES = [
    { asset: 'USDC', amount: 100000 },
    { asset: 'SOL', amount: 10 },
] as const;

solOrderbook.deposit('user_alice', 'USDC', 100000);
solOrderbook.deposit('user_bob', 'SOL', 500);

async function hydrateRegisteredUserBalances() {
    const users = await prisma.user.findMany({ select: { id: true } });

    if (users.length === 0) return;

    await prisma.accountBalance.createMany({
        data: users.flatMap((user) =>
            STARTER_TRADING_BALANCES.map((balance) => ({
                userId: user.id,
                asset: balance.asset,
                available: balance.amount,
                locked: 0,
            }))
        ),
        skipDuplicates: true,
    });

    const accountBalances = await prisma.accountBalance.findMany({
        where: {
            userId: { in: users.map((user) => user.id) },
            asset: { in: ['USDC', 'SOL'] },
        },
    });

    for (const balance of accountBalances) {
        solOrderbook.deposit(balance.userId, balance.asset, balance.available);
    }

    console.log(`Hydrated trading balances for ${users.length} registered users`);
}

console.log('Matching Engine Worker Running Core Loop...');

async function startEngineLoop() {
    while (true) {
        try {
            const data = await redisConsumer.blpop(REDIS_QUEUES.ACCOUNT_INIT, REDIS_QUEUES.ORDER_INFLOW, 0);
            if (!data) continue;

            const [queueName, rawMessage] = data;

            if (queueName === REDIS_QUEUES.ACCOUNT_INIT) {
                const accountInit: AccountInitialization = JSON.parse(rawMessage);
                for (const balance of accountInit.balances) {
                    solOrderbook.deposit(accountInit.userId, balance.asset, balance.amount);
                }
                console.log(`Initialized trading balances for user ${accountInit.userId}`);
                continue;
            }

            const order: Order = JSON.parse(rawMessage);

            console.log(`Processing incoming ${order.side} order from ${order.userId}`);

            try {
                const result = solOrderbook.processOrder(order);

                await redisPublisher.publish(
                    REDIS_CHANNELS.ORDER_UPDATES,
                    JSON.stringify({ orderId: order.id, ...result })
                );

                await redisPublisher.publish(
                    REDIS_CHANNELS.MARKET_DATA,
                    JSON.stringify({ pair: 'SOL_USDC', depth: solOrderbook.getDepth() })
                );

            } catch (err: any) {
                console.error(`Order execution validation failed: ${err.message}`);
            }

        } catch (loopError) {
            console.error('Critical Engine Core loop system crash error:', loopError);
        }
    }
}

hydrateRegisteredUserBalances()
    .then(startEngineLoop)
    .catch((err) => {
        console.error('Failed to hydrate registered trading balances:', err);
        process.exit(1);
    });