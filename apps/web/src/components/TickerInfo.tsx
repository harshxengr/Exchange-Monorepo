export function TickerInfo() {
    return (
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
    )
}