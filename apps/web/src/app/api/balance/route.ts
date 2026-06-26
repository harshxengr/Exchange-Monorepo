import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@exchange/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const balances = await prisma.accountBalance.findMany({
            where: { userId: session.user.id },
            select: { asset: true, available: true, locked: true }
        });
        return NextResponse.json({ success: true, balances });
    } catch (error) {
        console.error('Failed to fetch balances:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
