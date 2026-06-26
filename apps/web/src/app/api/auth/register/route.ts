import { NextResponse } from 'next/server';
import { prisma } from "@exchange/db";
import { createRedisClient, REDIS_QUEUES } from '@exchange/redis';
import { AccountInitialization } from '@exchange/types';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const STARTER_TRADING_BALANCES = [
    { asset: 'USDC', amount: 100000 },
    { asset: 'SOL', amount: 10 },
] as const;

const redisClient = createRedisClient();

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing parameters.' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ message: 'This email is already registered. Please use another email.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });

            await tx.accountBalance.createMany({
                data: STARTER_TRADING_BALANCES.map((balance) => ({
                    userId: createdUser.id,
                    asset: balance.asset,
                    available: balance.amount,
                    locked: 0,
                })),
            });

            return createdUser;
        });

        const accountInit: AccountInitialization = {
            type: 'ACCOUNT_INIT',
            userId: user.id,
            balances: STARTER_TRADING_BALANCES.map((balance) => ({ ...balance })),
        };

        await redisClient.lpush(REDIS_QUEUES.ACCOUNT_INIT, JSON.stringify(accountInit));

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
    } catch (error) {
        console.error('Registration initialization failed:', error);
        return NextResponse.json({ message: 'Internal register initialization error.' }, { status: 500 });
    }
}
