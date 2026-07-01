import { LiveTrade } from "@/hooks/useOrderbook";

interface TradeHistoryItem {
    price: number;
    quantity: number;
    side: 'BUY' | 'SELL';
    timestamp: string;
}

interface RecentTradesProps {
    trades: LiveTrade[];
    currentUserId?: string;
}

export function RecentTrades({ trades, currentUserId }: RecentTradesProps) {
    const tradesHistory: TradeHistoryItem[] = trades.slice(0, 30).map((trade) => ({
        price: trade.price,
        quantity: trade.quantity,
        side: trade.buyer === currentUserId ? 'BUY' : 'SELL',
        timestamp: new Date(trade.timestamp).toLocaleTimeString(),
    }));

    return (
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
    )
}
