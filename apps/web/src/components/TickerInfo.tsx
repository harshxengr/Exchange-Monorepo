import { LiveTrade } from "@/hooks/useOrderbook";

interface TickerInfoProps {
    trades: LiveTrade[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatPrice(value?: number) {
    if (value === undefined || !Number.isFinite(value)) return '--';
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatVolume(value: number) {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getTickerStats(trades: LiveTrade[]) {
    const validTrades = trades
        .filter((trade) =>
            Number.isFinite(trade.price) &&
            Number.isFinite(trade.quantity) &&
            Number.isFinite(trade.timestamp)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

    const lastTrade = validTrades.at(-1);
    const cutoff = Date.now() - ONE_DAY_MS;
    const trades24h = validTrades.filter((trade) => trade.timestamp >= cutoff);
    const openingTrade = trades24h[0];
    const lastPrice = lastTrade?.price;
    const openingPrice = openingTrade?.price;
    const change = lastPrice !== undefined && openingPrice !== undefined ? lastPrice - openingPrice : undefined;
    const changePercent =
        change !== undefined && openingPrice !== undefined && openingPrice !== 0
            ? (change / openingPrice) * 100
            : undefined;

    return {
        lastPrice,
        change,
        changePercent,
        high24h: trades24h.length > 0 ? Math.max(...trades24h.map((trade) => trade.price)) : undefined,
        low24h: trades24h.length > 0 ? Math.min(...trades24h.map((trade) => trade.price)) : undefined,
        volume24h: trades24h.reduce((total, trade) => total + trade.quantity, 0),
    };
}

export function TickerInfo({ trades }: TickerInfoProps) {
    const stats = getTickerStats(trades);
    const changeIsPositive = (stats.change ?? 0) >= 0;
    const changeText =
        stats.change === undefined || stats.changePercent === undefined
            ? '--'
            : `${changeIsPositive ? '+' : ''}${stats.change.toFixed(2)} ${changeIsPositive ? '+' : ''}${stats.changePercent.toFixed(2)}%`;

    return (
        <div className="flex h-12 items-center justify-between border-b border-[#1f2630] bg-[#12161a] px-4 shrink-0">
            <div className="flex items-center gap-6">
                <span className="text-sm font-bold text-[#eaecef] border-r border-[#1f2630] pr-6">SOL / USDC</span>
                <div className="flex gap-6 items-center">
                    <div>
                        <div className={`text-xs font-bold ${changeIsPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            ${formatPrice(stats.lastPrice)}
                        </div>
                        <div className="text-[10px] text-[#707a8a] font-mono">${formatPrice(stats.lastPrice)}</div>
                    </div>
                    <div>
                        <div className="text-[#707a8a] text-[10px]">24h Change</div>
                        <div className={`font-semibold font-mono ${changeIsPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {changeText}
                        </div>
                    </div>
                    <div>
                        <div className="text-[#707a8a] text-[10px]">24h High</div>
                        <div className="font-semibold text-[#eaecef] font-mono">{formatPrice(stats.high24h)}</div>
                    </div>
                    <div>
                        <div className="text-[#707a8a] text-[10px]">24h Low</div>
                        <div className="font-semibold text-[#eaecef] font-mono">{formatPrice(stats.low24h)}</div>
                    </div>
                    <div>
                        <div className="text-[#707a8a] text-[10px]">24h Volume</div>
                        <div className="font-semibold text-[#eaecef] font-mono">{formatVolume(stats.volume24h)} SOL</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
