'use client';

import { useState } from 'react';
import { useOrderbook } from '@/hooks/useOrderbook';
import { TradingChart } from '@/components/TradingChart';
import { ArrowUpRight, Radio, ShieldAlert } from 'lucide-react';

export default function ProfessionalExchangeApp() {
  const { orderbook, connected } = useOrderbook();
  const [userId, setUserId] = useState('user_alice');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState('134.38');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !quantity) return;
    setLoading(true);
    setStatus('');

    try {
      const res = await fetch('http://localhost:3000/api/v1/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, side, price: Number(price), quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`ORDER_ACCEPTED // ID: ${data.orderId}`);
        setQuantity('');
      } else {
        setStatus(`REJECTED: ${data.errors?.join(', ')}`);
      }
    } catch {
      setStatus('GATEWAY_CONNECTIVITY_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const askPrices = orderbook?.asks ? Object.keys(orderbook.asks).map(Number).sort((a, b) => b - a) : []; // Sells: highest on top
  const bidPrices = orderbook?.bids ? Object.keys(orderbook.bids).map(Number).sort((a, b) => b - a) : []; // Buys: highest on top

  const getLevelQty = (bookSide: any, priceKey: number): number => {
    if (!bookSide || !bookSide[priceKey]) return 0;
    const val = bookSide[priceKey];
    if (Array.isArray(val)) {
      return val.reduce((acc, obj) => acc + (Number(obj?.quantity) || Number(obj) || 0), 0);
    }
    if (typeof val === 'object') {
      return Number(val.quantity) || Number(val.amount) || 0;
    }
    return Number(val) || 0;
  };

  const getMaxTotal = () => {
    let max = 1;
    askPrices.forEach(p => { const t = getLevelQty(orderbook.asks, p); if (t > max) max = t; });
    bidPrices.forEach(p => { const t = getLevelQty(orderbook.bids, p); if (t > max) max = t; });
    return max;
  };
  const maxTotal = getMaxTotal();

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans text-xs antialiased select-none">
      {/* 1. Global Asset Header Ticker Bar */}
      <header className="flex h-14 items-center justify-between border-b border-[#1f2630] bg-[#12161a] px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-r border-[#1f2630] pr-6">
            <span className="text-base font-bold text-[#eaecef]">SOL / USDC</span>
          </div>

          <div className="flex gap-6 items-center">
            <div>
              <div className="text-sm font-bold text-[#0ecb81]">$134.64</div>
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
              <div className="font-semibold text-[#eaecef] font-mono">18,458.01</div>
            </div>
          </div>
        </div>

        {/* Core Infrastructure Connection Badge */}
        <div className="flex items-center gap-2 font-mono text-[10px] bg-[#1e2329] px-3 py-1 rounded-md border border-[#2b3139]">
          <Radio className={`w-3 h-3 ${connected ? 'text-[#0ecb81] animate-pulse' : 'text-[#f6465d]'}`} />
          <span>{connected ? 'LIVE_STREAM_ACTIVE' : 'DISCONNECTED'}</span>
        </div>
      </header>

      {/* 2. Main Platform Grid */}
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">

        {/* Left Side: Candlestick Workspace Container */}
        <div className="flex-1 flex flex-col bg-[#12161a] border-r border-[#1f2630] p-3 overflow-hidden">
          <div className="flex-1 min-h-[350px]">
            <TradingChart />
          </div>

          {/* Sub-Panel Logs Component Terminal */}
          <div className="h-40 border-t border-[#1f2630] mt-3 pt-3 flex flex-col overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-[#707a8a] mb-2 tracking-wider">System Pipeline Log Outputs</div>
            <div className="flex-1 bg-[#0b0e11] rounded p-3 font-mono text-[11px] text-[#848e9c] overflow-y-auto space-y-1 border border-[#1f2630]">
              <div>&gt;_ ENGINE QUEUE INTERFACE ONLINE // ATOMIC REBALANCING ROUTINES ENGAGED.</div>
              {status && (
                <div className={status.includes('ERROR') || status.includes('REJECTED') ? "text-[#f6465d]" : "text-[#0ecb81]"}>
                  &gt;_ {status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Active Level 2 Orderbook */}
        <div className="w-72 bg-[#12161a] border-r border-[#1f2630] flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 text-[10px] text-[#707a8a] py-2 px-3 border-b border-[#1f2630] font-semibold">
            <div>Price (USDC)</div>
            <div className="text-right">Size (SOL)</div>
            <div className="text-right">Total</div>
          </div>

          <div className="flex-1 flex flex-col justify-between font-mono overflow-y-auto">

            {/* ASKS (Sells) Table Render */}
            <div className="flex-1 flex flex-col justify-end overflow-hidden">
              {askPrices.slice(-15).map((askPrice: number, idx: number) => {
                const qty = getLevelQty(orderbook.asks, askPrice);
                if (qty <= 0) return null;
                const percentage = Math.min((qty / (maxTotal || 1)) * 100, 100);

                return (
                  <div key={`ask-${askPrice}-${idx}`} className="relative h-5 flex justify-between items-center px-3 hover:bg-[#202630] transition-colors cursor-pointer text-[11px]">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10 pointer-events-none transition-all duration-300" style={{ width: `${percentage}%` }} />
                    <span className="text-[#f6465d] font-semibold z-10">{askPrice.toFixed(2)}</span>
                    <span className="text-[#eaecef] text-right z-10">{qty.toFixed(2)}</span>
                    <span className="text-[#848e9c] text-right z-10">{qty.toFixed(2)}</span>
                  </div>
                );
              })}
              {askPrices.length === 0 && (
                <div className="text-center text-[#707a8a] py-4 text-[10px] italic">No active ask liquidity</div>
              )}
            </div>

            {/* Current Price Mid-market Bar Row */}
            <div className="bg-[#1e2329] border-y border-[#1f2630] py-2 px-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#0ecb81]">$134.64</span>
              <span className="text-[10px] text-[#707a8a]">Fair Price Value</span>
            </div>

            {/* BIDS (Buys) Table Render */}
            <div className="flex-1 overflow-hidden">
              {bidPrices.slice(0, 15).map((bidPrice: number, idx: number) => {
                const qty = getLevelQty(orderbook.bids, bidPrice);
                if (qty <= 0) return null;
                const percentage = Math.min((qty / (maxTotal || 1)) * 100, 100);

                return (
                  <div key={`bid-${bidPrice}-${idx}`} className="relative h-5 flex justify-between items-center px-3 hover:bg-[#202630] transition-colors cursor-pointer text-[11px]">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10 pointer-events-none transition-all duration-300" style={{ width: `${percentage}%` }} />
                    <span className="text-[#0ecb81] font-semibold z-10">{bidPrice.toFixed(2)}</span>
                    <span className="text-[#eaecef] text-right z-10">{qty.toFixed(2)}</span>
                    <span className="text-[#848e9c] text-right z-10">{qty.toFixed(2)}</span>
                  </div>
                );
              })}
              {bidPrices.length === 0 && (
                <div className="text-center text-[#707a8a] py-4 text-[10px] italic">No active bid liquidity</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Order Entry Action Input Panel */}
        <div className="w-80 bg-[#12161a] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* BUY/SELL Toggle Header Buttons */}
          <div className="grid grid-cols-2 p-1 bg-[#0b0e11] rounded-lg border border-[#1f2630]">
            <button
              onClick={() => setSide('BUY')}
              className={`py-2 text-xs font-bold rounded-md transition-all ${side === 'BUY' ? 'bg-[#0ecb81] text-[#0b0e11]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`py-2 text-xs font-bold rounded-md transition-all ${side === 'SELL' ? 'bg-[#f6465d] text-[#0b0e11]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
            >
              Sell
            </button>
          </div>

          {/* Account Profile Assignment Dropdown Input wrapper */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#707a8a] tracking-wider">Trading Profile Identity</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-[#161a1e] border border-[#2b3139] rounded px-3 py-2 text-xs outline-none focus:border-[#475262] text-[#eaecef] cursor-pointer"
            >
              <option value="user_alice">Alice Profile (Starts with USD)</option>
              <option value="user_bob">Bob Profile (Starts with SOL)</option>
            </select>
          </div>

          {/* Limit / Market Execution Option Toggles */}
          <div className="flex gap-4 border-b border-[#1f2630] pb-1">
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`pb-1.5 text-xs font-semibold relative ${orderType === 'LIMIT' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}
            >
              Limit
            </button>
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`pb-1.5 text-xs font-semibold relative ${orderType === 'MARKET' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}
            >
              Market
            </button>
          </div>

          {/* Core Numerical Order Inputs Form block */}
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="flex justify-between text-[11px] text-[#848e9c]">
              <span>Available Balance</span>
              <span className="font-mono text-[#eaecef]">
                {side === 'BUY' ? '100,000.00 USDC' : '2.0000 SOL'}
              </span>
            </div>

            {/* Price Input Form Row */}
            {orderType === 'LIMIT' && (
              <div className="space-y-1">
                <label className="text-[10px] text-[#707a8a] font-bold uppercase tracking-wider">Price</label>
                <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-transparent p-2.5 pr-12 font-mono text-xs outline-none text-[#eaecef]"
                  />
                  <span className="absolute right-3 font-bold text-[#707a8a] text-[10px]">USDC</span>
                </div>
              </div>
            )}

            {/* Quantity Input Form Row */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#707a8a] font-bold uppercase tracking-wider">Quantity</label>
              <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-transparent p-2.5 pr-12 font-mono text-xs outline-none text-[#eaecef]"
                  required
                />
                <span className="absolute right-3 font-bold text-[#707a8a] text-[10px]">SOL</span>
              </div>
            </div>

            {/* Fast Percentage Allocation Buttons bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['25%', '50%', '75%', 'Max'].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className="bg-[#2b3139] hover:bg-[#363e4a] text-[#eaecef] rounded py-1 font-mono text-[10px] transition-colors"
                >
                  {pct}
                </button>
              ))}
            </div>

            {/* Big Dispatch Action Submit execution button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded text-sm font-bold shadow-md transition-all active:scale-[0.99] text-[#0b0e11] mt-6 ${side === 'BUY' ? 'bg-[#0ecb81] hover:bg-[#0bba74]' : 'bg-[#f6465d] hover:bg-[#e03f54]'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Routing Order Ticket...' : `${side === 'BUY' ? 'Buy' : 'Sell'} SOL`}
            </button>
          </form>

          {/* Quick Informational Options Footer Area */}
          <div className="flex gap-4 border-t border-[#1f2630] pt-4 text-[11px] text-[#848e9c]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="accent-[#0ecb81]" /> Post Only
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="accent-[#0ecb81]" /> IOC
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}