import express from 'express';
import { z } from 'zod';
import { createRedisClient, REDIS_QUEUES } from '@exchange/redis';
import { Order } from '@exchange/types';
import { env } from '@exchange/env';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const redisClient = createRedisClient();

const OrderSchema = z.object({
    price: z.number().nonnegative('Price must be zero or greater'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    side: z.enum(['BUY', 'SELL']),
    userId: z.string().min(1, 'User ID is required'),
    orderType: z.enum(['LIMIT', 'MARKET']).default('LIMIT'),
    postOnly: z.boolean().default(false),
    ioc: z.boolean().default(false),
});

app.post('/api/v1/order', async (req, res) => {
    try {
        const validationResult = OrderSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                errors: validationResult.error.issues.map(err => err.message)
            });
        }

        const { price, quantity, side, userId, orderType, postOnly, ioc } = validationResult.data;

        if (orderType === 'LIMIT' && price <= 0) {
            return res.status(400).json({
                success: false,
                errors: ['Limit orders require a price greater than zero'],
            });
        }

        const systemGeneratedOrder = {
            id: `ord_${Math.random().toString(36).substring(2, 11)}`,
            price,
            quantity,
            side,
            userId,
            orderType,
            postOnly,
            ioc,
            timestamp: Date.now(),
        } satisfies Order & { orderType: 'LIMIT' | 'MARKET'; postOnly: boolean; ioc: boolean };

        await redisClient.lpush(
            REDIS_QUEUES.ORDER_INFLOW,
            JSON.stringify(systemGeneratedOrder)
        );

        console.log(`Queued ${side} order ${systemGeneratedOrder.id} from user ${userId}`);

        return res.status(202).json({
            success: true,
            message: "Order placed successfully and added to matching pipeline queue.",
            orderId: systemGeneratedOrder.id
        });

    } catch (error) {
        console.error("API Gateway error processing ingestion:", error);
        return res.status(500).json({ success: false, error: "Internal Gateway Server Error" });
    }
});

const PORT = env.PORT;
app.listen(PORT, () => {
    console.log(`API Gateway operational on http://localhost:${PORT}`);
});