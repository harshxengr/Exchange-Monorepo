interface OrderbookLevel {
    quantity: number;
}

interface OrderBookProps {
    orderbook: {
        asks?: Record<number, OrderbookLevel[]>;
        bids?: Record<number, OrderbookLevel[]>;
    }
}

export function OrderBook({ orderbook }: OrderBookProps) {

    const getLevelQty = (bookSide: Record<number, OrderbookLevel[]> | undefined, priceKey: number): number => {
        if (!bookSide || !bookSide[priceKey]) return 0;
        const orderArray = bookSide[priceKey];
        if (Array.isArray(orderArray)) {
            return orderArray.reduce((acc, order) => acc + (Number(order.quantity) || 0), 0);
        }
        return 0;
    };

    const askPrices = orderbook?.asks ? Object.keys(orderbook.asks).map(Number).sort((a, b) => b - a) : [];
    const bidPrices = orderbook?.bids ? Object.keys(orderbook.bids).map(Number).sort((a, b) => b - a) : [];
    const bestAsk = askPrices.length > 0 ? Math.min(...askPrices) : undefined;
    const bestBid = bidPrices.length > 0 ? Math.max(...bidPrices) : undefined;
    const midMarketPrice =
        bestBid !== undefined && bestAsk !== undefined
            ? (bestBid + bestAsk) / 2
            : bestBid ?? bestAsk;

    const getMaxTotal = () => {
        let max = 1;
        askPrices.forEach(p => { const q = getLevelQty(orderbook.asks, p); if (q > max) max = q; });
        bidPrices.forEach(p => { const q = getLevelQty(orderbook.bids, p); if (q > max) max = q; });
        return max;
    };
    const maxTotal = getMaxTotal();

    return (
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
                    <span className="text-xs font-bold text-[#0ecb81]">
                        {midMarketPrice !== undefined ? `$${midMarketPrice.toFixed(2)}` : '--'}
                    </span>
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
    )
}
