import { NextResponse } from 'next/server';
import { prisma } from '@exchange/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get('limit') ?? 200);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 500) : 200;

    try {
        const trades = await prisma.trade.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit,
            select: {
                id: true,
                buyerId: true,
                sellerId: true,
                price: true,
                quantity: true,
                timestamp: true,
            },
        });

        return NextResponse.json({
            success: true,
            trades: trades.map((trade) => ({
                id: trade.id,
                buyer: trade.buyerId,
                seller: trade.sellerId,
                price: trade.price,
                quantity: trade.quantity,
                timestamp: trade.timestamp.getTime(),
            })),
        });
    } catch (error) {
        console.error('Failed to fetch market trades:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch market trades' }, { status: 500 });
    }
}
