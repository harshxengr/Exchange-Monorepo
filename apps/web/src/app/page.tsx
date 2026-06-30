'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrderbook } from '@/hooks/useOrderbook';
import { TradingChart } from '@/components/TradingChart';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/Header';
import { TickerInfo } from '@/components/TickerInfo';
import { OrderBook } from '@/components/OrderBook';
import { OrderEntryForm } from '@/components/OrderEntryForm';
import { RecentTrades } from '@/components/RecentTrades';
import { BalanceDisplay } from '@/components/BalanceDisplay';

interface TradeHistoryItem {
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

interface OrderResponse {
  success?: boolean;
  orderId?: string;
  errors?: string[];
  trades?: Array<{ price: number; quantity: number; buyer: string }>;
}

export default function ProfessionalExchangeApp() {
  const { data: session } = useSession();
  const { orderbook, connected } = useOrderbook();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [tradesHistory, setTradesHistory] = useState<TradeHistoryItem[]>([]);
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
    fetchBalances();
    const interval = setInterval(fetchBalances, 3000);
    return () => clearInterval(interval);
  }, [userId, fetchBalances]);

  const handlePlaceOrder = async (orderFormValues: any) => {
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

        if (data.trades && data.trades.length > 0) {
          const newTrades: TradeHistoryItem[] = data.trades.map((t) => ({
            price: Number(t.price),
            quantity: Number(t.quantity),
            side: t.buyer === userId ? 'BUY' : 'SELL',
            timestamp: new Date().toLocaleTimeString()
          }));
          setTradesHistory(prev => [...newTrades, ...prev].slice(0, 15));
        }
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
      <TickerInfo />

      <div className="flex flex-1 overflow-hidden">

        {/* Charting Desk */}
        <div className="flex-1 flex flex-col bg-[#12161a] border-r border-[#1f2630] p-3 overflow-hidden">
          <div className="flex-1 min-h-[350px]">
            <TradingChart />
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

        {/* Right Execution Dock Container */}
        <div className="w-80 bg-[#12161a] flex flex-col overflow-hidden">
          <div>
            <OrderEntryForm userId={userId} loading={loading} onPlaceOrder={handlePlaceOrder} />
            <div className="px-4 pb-4 bg-[#12161a]">
              <BalanceDisplay balances={balances} />
            </div>
          </div>
          <RecentTrades tradesHistory={tradesHistory} />
        </div>

      </div>
    </div>
  );
}