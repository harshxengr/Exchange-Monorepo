interface BalanceItem {
    asset: string;
    available: number;
    locked: number;
}

interface BalanceDisplayProps {
    balances: BalanceItem[];
}

export function BalanceDisplay({ balances }: BalanceDisplayProps) {
    const usdc = balances.find(b => b.asset === 'USDC');
    const sol = balances.find(b => b.asset === 'SOL');

    return (
        <div className="mt-3 p-3 bg-[#0b0e11] rounded border border-[#1f2630] font-mono text-[10px] space-y-1 select-none">
            <div className="text-[9px] uppercase font-bold text-[#707a8a] mb-1 tracking-wider">Balances</div>
            <div className="grid grid-cols-3 text-[#707a8a] font-semibold border-b border-[#1f2630]/60 pb-1">
                <div>Asset</div>
                <div className="text-right">Available</div>
                <div className="text-right">Locked</div>
            </div>
            <div className="flex justify-between text-[#eaecef] pt-1">
                <span>USDC</span>
                <span className="text-right">{usdc?.available?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                <span className="text-right text-[#707a8a]">{usdc?.locked?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-[#eaecef]">
                <span>SOL</span>
                <span className="text-right">{sol?.available?.toFixed(4) || '0.0000'}</span>
                <span className="text-right text-[#707a8a]">{sol?.locked?.toFixed(4) || '0.0000'}</span>
            </div>
        </div>
    )
}