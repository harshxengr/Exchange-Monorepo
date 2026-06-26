import { prisma } from "@exchange/db";
import { createRedisClient, REDIS_CHANNELS } from '@exchange/redis';

const redisSubscriber = createRedisClient();

async function startDbWorkerHub() {
    await redisSubscriber.subscribe(REDIS_CHANNELS.ORDER_UPDATES);
    console.log('Database Sync Worker successfully listening to Redis Pub/Sub...');

    redisSubscriber.on('message', async (channel, message) => {
        if (channel !== REDIS_CHANNELS.ORDER_UPDATES) return;

        try {
            const executionPayload = JSON.parse(message);
            const { trades } = executionPayload;

            if (!trades || trades.length === 0) return;

            console.log(`Persisting ${trades.length} trade execution records to PostgreSQL...`);

            await prisma.$transaction(async (tx: any) => {
                for (const trade of trades) {
                    await tx.trade.create({
                        data: {
                            buyerId: trade.buyer,
                            sellerId: trade.seller,
                            price: trade.price,
                            quantity: trade.quantity,
                            timestamp: new Date(trade.timestamp)
                        }
                    });

                    await tx.accountBalance.upsert({
                        where: { userId_asset: { userId: trade.buyer, asset: 'USDC' } },
                        update: { available: { decrement: trade.price * trade.quantity } },
                        create: { userId: trade.buyer, asset: 'USDC', available: 100000 - (trade.price * trade.quantity), locked: 0 }
                    });

                    await tx.accountBalance.upsert({
                        where: { userId_asset: { userId: trade.buyer, asset: 'SOL' } },
                        update: { available: { increment: trade.quantity } },
                        create: { userId: trade.buyer, asset: 'SOL', available: trade.quantity, locked: 0 }
                    });

                    await tx.accountBalance.upsert({
                        where: { userId_asset: { userId: trade.seller, asset: 'SOL' } },
                        update: { available: { decrement: trade.quantity } },
                        create: { userId: trade.seller, asset: 'SOL', available: 10 - trade.quantity, locked: 0 }
                    });

                    await tx.accountBalance.upsert({
                        where: { userId_asset: { userId: trade.seller, asset: 'USDC' } },
                        update: { available: { increment: trade.price * trade.quantity } },
                        create: { userId: trade.seller, asset: 'USDC', available: trade.price * trade.quantity, locked: 0 }
                    });
                }
            });

            console.log('Successfully synced trade balances to database.');

        } catch (dbError) {
            console.error('CRITICAL: Failed to write transaction records to PostgreSQL:', dbError);
        }
    });
}

startDbWorkerHub().catch((err) => {
    console.error('Failed to initialize local DB Persistence service broker:', err);
});