'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrderbook } from '@/hooks/useOrderbook';
import { TradingChart } from '@/components/TradingChart';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/Header';
import { TickerInfo } from '@/components/TickerInfo';
import { OrderBook } from '@/components/OrderBook';
import { OrderEntryForm, OrderFormValues } from '@/components/OrderEntryForm';
import { RecentTrades } from '@/components/RecentTrades';
import { BalanceDisplay } from '@/components/BalanceDisplay';

interface OrderResponse {
    success?: boolean;
    orderId?: string;
    errors?: string[];
}

export default function Dashboard() {
    const { data: session } = useSession();
    const { orderbook, trades, connected } = useOrderbook();
    const userId = session?.user?.id;

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [balances, setBalances] = useState<Array<{ asset: string; available: number; locked: number }>>([]);

    const fetchBalances = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch('/api/balance');
            const data = await res.json();
            if (data.success) {
                setBalances(data.balances);
            }
        } catch (err) {
            console.error('Error fetching balances:', err);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const initialFetch = setTimeout(fetchBalances, 0);
        const interval = setInterval(fetchBalances, 3000);
        return () => {
            clearTimeout(initialFetch);
            clearInterval(interval);
        };
    }, [userId, fetchBalances]);

    const handlePlaceOrder = async (orderFormValues: OrderFormValues) => {
        if (!userId) {
            setStatus('AUTHENTICATED_USER_REQUIRED');
            return;
        }
        setLoading(true);
        setStatus('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/api/v1/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...orderFormValues }),
            });
            const data = (await res.json()) as OrderResponse;

            if (data.success || data.orderId) {
                setStatus(`ORDER_ACCEPTED // ID: ${data.orderId || 'ord_success'}`);
                fetchBalances();
            } else {
                setStatus(`REJECTED: ${data.errors?.join(', ') || 'Validation error'}`);
            }
        } catch {
            setStatus('GATEWAY_CONNECTIVITY_ERROR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans text-xs antialiased flex flex-col overflow-hidden">
            
            <Header session={session} connected={connected} />
            
            <TickerInfo trades={trades} />

            <div className="flex flex-1 overflow-hidden">

                <div className="flex-1 flex flex-col bg-[#12161a] border-r border-[#1f2630] p-3 overflow-hidden">
                    <div className="flex-1 min-h-[350px]">
                        <TradingChart trades={trades} />
                    </div>
                    <div className="h-28 border-t border-[#1f2630] mt-3 pt-3 flex flex-col overflow-hidden">
                        <div className="text-[10px] uppercase font-bold text-[#707a8a] mb-1 tracking-wider">Log Outputs</div>
                        <div className="flex-1 bg-[#0b0e11] rounded p-2 font-mono text-[11px] text-[#848e9c] overflow-y-auto space-y-1 border border-[#1f2630]">
                            <div>&gt;_ Matching Engine Core Connected Successfully.</div>
                            {status && (
                                <div className={status.includes('ERROR') || status.includes('REJECTED') ? "text-[#f6465d]" : "text-[#0ecb81]"}>
                                    &gt;_ {status}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <OrderBook orderbook={orderbook} />

                <div className="w-80 bg-[#12161a] flex flex-col overflow-hidden">
                    <div>
                        <OrderEntryForm userId={userId} loading={loading} onPlaceOrder={handlePlaceOrder} />
                        <div className="px-4 pb-4 bg-[#12161a]">
                            <BalanceDisplay balances={balances} />
                        </div>
                    </div>
                    <RecentTrades trades={trades} currentUserId={userId} />
                </div>

            </div>
        </div>
    );
}
