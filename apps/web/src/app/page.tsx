'use client';

import { useState, useEffect } from 'react';
import { useOrderbook } from '@/hooks/useOrderbook';
import { TradingChart } from '@/components/TradingChart';
import { useSession, signOut } from 'next-auth/react';
import { Radio, LogOut, User } from 'lucide-react';

interface TradeHistoryItem {
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

interface OrderResponseTrade {
  price: number;
  quantity: number;
  buyer: string;
}

interface OrderResponse {
  success?: boolean;
  orderId?: string;
  errors?: string[];
  trades?: OrderResponseTrade[];
}

interface OrderbookLevel {
  quantity: number;
}

export default function ProfessionalExchangeApp() {
  const { data: session } = useSession();

  const { orderbook, connected } = useOrderbook();
  const userId = session?.user?.id;
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState('134.38');
  const [quantity, setQuantity] = useState('');
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [tradesHistory, setTradesHistory] = useState<TradeHistoryItem[]>([]);
  const [balances, setBalances] = useState<{ asset: string; available: number; locked: number }[]>([]);

  const fetchBalances = async () => {
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
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setStatus('AUTHENTICATED_USER_REQUIRED');
      return;
    }
    if (orderType === 'LIMIT' && !price) return;
    if (!quantity) return;
    setLoading(true);
    setStatus('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/v1/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          side,
          price: orderType === 'LIMIT' ? Number(price) : 0,
          quantity: Number(quantity),
          orderType,
          postOnly,
          ioc
        }),
      });
      const data = (await res.json()) as OrderResponse;
      if (data.success || data.orderId) {
        setStatus(`ORDER_ACCEPTED // ID: ${data.orderId || 'ord_success'}`);
        setQuantity('');
        fetchBalances();

        if (data.trades && data.trades.length > 0) {
          const newTrades: TradeHistoryItem[] = data.trades.map((t) => ({
            price: Number(t.price),
            quantity: Number(t.quantity),
            side: (t.buyer === userId ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
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

  const getLevelQty = (bookSide: Record<number, OrderbookLevel[]>, priceKey: number): number => {
    if (!bookSide || !bookSide[priceKey]) return 0;
    const orderArray = bookSide[priceKey];
    if (Array.isArray(orderArray)) {
      return orderArray.reduce((acc, order) => acc + (Number(order.quantity) || 0), 0);
    }
    return 0;
  };

  const askPrices = orderbook?.asks ? Object.keys(orderbook.asks).map(Number).sort((a, b) => b - a) : [];
  const bidPrices = orderbook?.bids ? Object.keys(orderbook.bids).map(Number).sort((a, b) => b - a) : [];

  const getMaxTotal = () => {
    let max = 1;
    askPrices.forEach(p => { const q = getLevelQty(orderbook.asks, p); if (q > max) max = q; });
    bidPrices.forEach(p => { const q = getLevelQty(orderbook.bids, p); if (q > max) max = q; });
    return max;
  };
  const maxTotal = getMaxTotal();

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans text-xs antialiased select-none">
      {/* Top Application Header Navbar */}
      <header className="flex h-12 items-center justify-between border-b border-[#1f2630] bg-[#12161a] px-4 shrink-0">
        <div className="flex items-center gap-8">
          <span className="text-xs font-bold text-white border-b-2 border-[#0ecb81] pb-[15px] pt-3 cursor-pointer">Exchange</span>
          <span className="text-xs font-medium text-[#707a8a] cursor-pointer hover:text-[#eaecef] transition-colors">Markets</span>
          <span className="text-xs font-medium text-[#707a8a] cursor-pointer hover:text-[#eaecef] transition-colors">Trade</span>
        </div>

        {/* Real-time authenticated profile indicators and signOut action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#848e9c]">
            <User className="w-3.5 h-3.5 text-[#0ecb81]" />
            <span>{session?.user?.name || 'Loading Account...'}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="flex items-center gap-1.5 font-mono text-[10px] text-[#707a8a] hover:text-[#f6465d] transition-colors border border-[#2b3139] px-2 py-1 rounded bg-[#1e2329]"
          >
            <LogOut className="w-3 h-3" />
            <span>DISCONNECT_TERMINAL</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-[10px] bg-[#1e2329] px-2.5 py-1 rounded border border-[#2b3139]">
            <Radio className={`w-3 h-3 ${connected ? 'text-[#0ecb81] animate-pulse' : 'text-[#f6465d]'}`} />
            <span>{connected ? 'LIVE_STREAM_ACTIVE' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </header>

      {/* Asset Ticker Info Bar */}
      <div className="flex h-12 items-center justify-between border-b border-[#1f2630] bg-[#12161a] px-4 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-[#eaecef] border-r border-[#1f2630] pr-6">SOL / USDC</span>
          <div className="flex gap-6 items-center">
            <div>
              <div className="text-xs font-bold text-[#0ecb81]">$134.64</div>
              <div className="text-[10px] text-[#707a8a] font-mono">$134.64</div>
            </div>
            <div>
              <div className="text-[#707a8a] text-[10px]">24h Change</div>
              <div className="font-semibold text-[#f6465d] font-mono">-0.5 -0.00%</div>
            </div>
            <div>
              <div className="text-[#707a8a] text-[10px]">24h High</div>
              <div className="font-semibold text-[#eaecef] font-mono">136.61</div>
            </div>
            <div>
              <div className="text-[#707a8a] text-[10px]">24h Low</div>
              <div className="font-semibold text-[#eaecef] font-mono">133.13</div>
            </div>
            <div>
              <div className="text-[#707a8a] text-[10px]">24h Volume</div>
              <div className="font-semibold text-[#eaecef] font-mono">18,458.01 SOL</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Side Section: Interactive Charts and Status Logs */}
        <div className="flex-1 flex flex-col bg-[#12161a] border-r border-[#1f2630] p-3 overflow-hidden">
          <div className="flex-1 min-h-[350px]">
            <TradingChart />
          </div>

          <div className="h-28 border-t border-[#1f2630] mt-3 pt-3 flex flex-col overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-[#707a8a] mb-1 tracking-wider">System Pipeline Log Outputs</div>
            <div className="flex-1 bg-[#0b0e11] rounded p-2 font-mono text-[11px] text-[#848e9c] overflow-y-auto space-y-1 border border-[#1f2630]">
              <div>&gt;_ MATCHING ENGINE CORE CONNECTED SUCCESFULLY.</div>
              {status && (
                <div className={status.includes('ERROR') || status.includes('REJECTED') ? "text-[#f6465d]" : "text-[#0ecb81]"}>
                  &gt;_ {status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel Section: Full Height Orderbook Desk */}
        <div className="w-64 bg-[#12161a] border-r border-[#1f2630] flex flex-col overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-[#707a8a] px-3 pt-2 tracking-wider">Order Book</div>
          <div className="grid grid-cols-3 text-[10px] text-[#707a8a] py-2 px-3 border-b border-[#1f2630] font-semibold mt-1">
            <div>Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>

          <div className="flex-1 flex flex-col justify-between font-mono overflow-hidden">
            {/* ASKS Rows (Sells) */}
            <div className="flex-1 flex flex-col justify-end overflow-hidden pb-0.5">
              {askPrices.slice(-14).map((askPrice, idx) => {
                const qty = getLevelQty(orderbook.asks, askPrice);
                if (qty <= 0) return null;
                const percentage = Math.min((qty / maxTotal) * 100, 100);
                return (
                  <div key={`ask-row-${askPrice}-${idx}`} className="relative h-4.5 flex justify-between items-center px-3 hover:bg-[#202630] cursor-pointer text-[11px]">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/12 pointer-events-none" style={{ width: `${percentage}%` }} />
                    <span className="text-[#f6465d] z-10">{askPrice.toFixed(2)}</span>
                    <span className="text-[#eaecef] text-right z-10">{qty.toFixed(2)}</span>
                    <span className="text-[#848e9c] text-right z-10">{qty.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#1e2329] border-y border-[#1f2630] py-1.5 px-3 flex justify-between items-center">
              <span className="text-xs font-bold text-[#0ecb81]">$134.64</span>
              <span className="text-[9px] text-[#707a8a]">Mid Market Price</span>
            </div>

            {/* BIDS Rows (Buys) */}
            <div className="flex-1 overflow-hidden pt-0.5">
              {bidPrices.slice(0, 14).map((bidPrice, idx) => {
                const qty = getLevelQty(orderbook.bids, bidPrice);
                if (qty <= 0) return null;
                const percentage = Math.min((qty / maxTotal) * 100, 100);
                return (
                  <div key={`bid-row-${bidPrice}-${idx}`} className="relative h-4.5 flex justify-between items-center px-3 hover:bg-[#202630] cursor-pointer text-[11px]">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/12 pointer-events-none" style={{ width: `${percentage}%` }} />
                    <span className="text-[#0ecb81] z-10">{bidPrice.toFixed(2)}</span>
                    <span className="text-[#eaecef] text-right z-10">{qty.toFixed(2)}</span>
                    <span className="text-[#848e9c] text-right z-10">{qty.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section Column: Order Entry on top, Recent Trades EXACTLY at the bottom */}
        <div className="w-80 bg-[#12161a] flex flex-col overflow-hidden">

          {/* Order Placement Action Card Box */}
          <div className="p-4 flex flex-col gap-3.5 border-b border-[#1f2630] bg-[#12161a]">
            <div className="grid grid-cols-2 p-0.5 bg-[#0b0e11] rounded border border-[#1f2630]">
              <button onClick={() => setSide('BUY')} className={`py-1.5 text-xs font-bold rounded ${side === 'BUY' ? 'bg-[#0ecb81] text-[#0b0e11]' : 'text-[#848e9c]'}`}>Buy</button>
              <button onClick={() => setSide('SELL')} className={`py-1.5 text-xs font-bold rounded ${side === 'SELL' ? 'bg-[#f6465d] text-[#0b0e11]' : 'text-[#848e9c]'}`}>Sell</button>
            </div>

            <div className="flex gap-4 border-b border-[#1f2630] text-[11px]">
              <button type="button" onClick={() => setOrderType('LIMIT')} className={`pb-1 font-bold ${orderType === 'LIMIT' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Limit</button>
              <button type="button" onClick={() => setOrderType('MARKET')} className={`pb-1 font-bold ${orderType === 'MARKET' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Market</button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3">
              {orderType === 'LIMIT' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-[#707a8a] font-bold uppercase">Price</label>
                  <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent p-2 text-xs outline-none text-[#eaecef]" />
                    <span className="absolute right-3 font-bold text-[#707a8a] text-[9px]">USDC</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-[#707a8a] font-bold uppercase">Quantity</label>
                <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                  <input type="number" step="0.01" placeholder="0.00" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-transparent p-2 text-xs outline-none text-[#eaecef]" required />
                  <span className="absolute right-3 font-bold text-[#707a8a] text-[9px]">SOL</span>
                </div>
              </div>

              {orderType === 'LIMIT' && (
                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#848e9c] hover:text-[#eaecef]">
                    <input type="checkbox" checked={postOnly} onChange={(e) => { setPostOnly(e.target.checked); if (e.target.checked) setIoc(false); }} className="accent-[#0ecb81]" />
                    <div>
                      <span className="text-[#eaecef] font-semibold block text-[11px]">Post Only</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#848e9c] hover:text-[#eaecef] mt-0.5">
                    <input type="checkbox" checked={ioc} onChange={(e) => { setIoc(e.target.checked); if (e.target.checked) setPostOnly(false); }} className="accent-[#0ecb81]" />
                    <div>
                      <span className="text-[#eaecef] font-semibold block text-[11px]">IOC (Immediate or Cancel)</span>
                    </div>
                  </label>
                </div>
              )}

              <button type="submit" disabled={loading || !userId} className={`w-full py-2.5 rounded text-xs font-bold text-[#0b0e11] mt-2 shadow transition-all ${side === 'BUY' ? 'bg-[#0ecb81] hover:bg-[#0bba74]' : 'bg-[#f6465d] hover:bg-[#e03f54]'} ${loading || !userId ? 'opacity-40 cursor-not-allowed' : ''}`}>
                {loading ? 'Routing Ticket...' : `${side === 'BUY' ? 'Buy' : 'Sell'} SOL`}
              </button>
            </form>

            {/* Wallet Balance Display */}
            <div className="mt-3 p-3 bg-[#0b0e11] rounded border border-[#1f2630] font-mono text-[10px] space-y-1">
              <div className="text-[9px] uppercase font-bold text-[#707a8a] mb-1 tracking-wider">Balances</div>
              <div className="grid grid-cols-3 text-[#707a8a] font-semibold border-b border-[#1f2630]/60 pb-1">
                <div>Asset</div>
                <div className="text-right">Available</div>
                <div className="text-right">Locked</div>
              </div>
              <div className="flex justify-between text-[#eaecef] pt-1">
                <span>USDC</span>
                <span className="text-right">{balances.find(b => b.asset === 'USDC')?.available?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</span>
                <span className="text-right text-[#707a8a]">{balances.find(b => b.asset === 'USDC')?.locked?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-[#eaecef]">
                <span>SOL</span>
                <span className="text-right">{balances.find(b => b.asset === 'SOL')?.available?.toFixed(4) || '0.0000'}</span>
                <span className="text-right text-[#707a8a]">{balances.find(b => b.asset === 'SOL')?.locked?.toFixed(4) || '0.0000'}</span>
              </div>
            </div>
          </div>

          {/* AS INDICATED IN THE SCREENSHOT: Recent Trades Container sitting exactly at the bottom right */}
          <div className="flex-1 flex flex-col bg-[#0b0e11] overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-[#707a8a] px-4 py-2.5 border-b border-[#1f2630] tracking-wider bg-[#12161a]">
              Recent Trades
            </div>
            <div className="grid grid-cols-3 text-[9px] text-[#707a8a] py-1.5 px-4 bg-[#12161a] font-semibold font-mono border-b border-[#1f2630]/60">
              <div>Price (USDC)</div>
              <div className="text-right">Size (SOL)</div>
              <div className="text-right">Time</div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] divide-y divide-[#1f2630]/20">
              {tradesHistory.map((trade, idx) => (
                <div key={`th-bottom-right-${idx}`} className="flex justify-between items-center py-2 px-4 hover:bg-[#161a1e]">
                  <span className={trade.side === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                    {trade.price.toFixed(2)}
                  </span>
                  <span className="text-[#eaecef] text-right">{trade.quantity.toFixed(2)}</span>
                  <span className="text-[#707a8a] text-right text-[10px]">{trade.timestamp}</span>
                </div>
              ))}
              {tradesHistory.length === 0 && (
                <div className="text-center text-[#707a8a] py-12 text-[10px] italic">
                  Waiting for market match events...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}