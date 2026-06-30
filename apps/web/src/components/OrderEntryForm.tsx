import { useState } from "react";

interface OrderEntryFormProps {
    userId?: string;
    loading: boolean;
    onPlaceOrder: (orderData: any) => Promise<void>;
}

export function OrderEntryForm({ userId, loading, onPlaceOrder }: OrderEntryFormProps) {

    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
    const [price, setPrice] = useState('134.38');
    const [quantity, setQuantity] = useState('');
    const [postOnly, setPostOnly] = useState(false);
    const [ioc, setIoc] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderType === 'LIMIT' && !price) return;
        if (!quantity) return;

        onPlaceOrder({
            side,
            orderType,
            price: orderType === 'LIMIT' ? Number(price) : 0,
            quantity: Number(quantity),
            postOnly,
            ioc
        });
        setQuantity('');
    };

    return (
        <div className="p-4 flex flex-col gap-3.5 border-b border-[#1f2630] bg-[#12161a]">
            <div className="grid grid-cols-2 p-0.5 bg-[#0b0e11] rounded border border-[#1f2630]">
                <button onClick={() => setSide('BUY')} className={`py-1.5 text-xs font-bold rounded ${side === 'BUY' ? 'bg-[#0ecb81] text-[#0b0e11]' : 'text-[#848e9c]'}`}>Buy</button>
                <button onClick={() => setSide('SELL')} className={`py-1.5 text-xs font-bold rounded ${side === 'SELL' ? 'bg-[#f6465d] text-[#0b0e11]' : 'text-[#848e9c]'}`}>Sell</button>
            </div>

            <div className="flex gap-4 border-b border-[#1f2630] text-[11px]">
                <button type="button" onClick={() => setOrderType('LIMIT')} className={`pb-1 font-bold ${orderType === 'LIMIT' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Limit</button>
                <button type="button" onClick={() => setOrderType('MARKET')} className={`pb-1 font-bold ${orderType === 'MARKET' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Market</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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
        </div>
    )
}