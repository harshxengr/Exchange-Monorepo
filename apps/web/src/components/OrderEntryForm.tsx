import { useState } from "react";

interface OrderEntryFormProps {
    userId?: string;
    loading: boolean;
    onPlaceOrder: (orderData: OrderFormValues) => Promise<void>;
}

export interface OrderFormValues {
    side: 'BUY' | 'SELL';
    orderType: 'LIMIT' | 'MARKET';
    price: number;
    quantity: number;
    postOnly: boolean;
    ioc: boolean;
}

export function OrderEntryForm({ userId, loading, onPlaceOrder }: OrderEntryFormProps) {

    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
    const [price, setPrice] = useState('134.38');
    const [quantity, setQuantity] = useState('');
    const [postOnly, setPostOnly] = useState(false);
    const [ioc, setIoc] = useState(false);
    const [formError, setFormError] = useState('');

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);
    const priceIsValid = orderType === 'MARKET' || (Number.isFinite(parsedPrice) && parsedPrice > 0);
    const quantityIsValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
    const formIsValid = priceIsValid && quantityIsValid;

    const handleOrderTypeChange = (nextOrderType: 'LIMIT' | 'MARKET') => {
        setOrderType(nextOrderType);
        setFormError('');

        if (nextOrderType === 'MARKET') {
            setPostOnly(false);
            setIoc(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!quantityIsValid) {
            setFormError('Quantity must be greater than zero.');
            return;
        }

        if (!priceIsValid) {
            setFormError('Limit price must be greater than zero.');
            return;
        }

        if (orderType === 'MARKET' && (postOnly || ioc)) {
            setFormError('Market orders cannot use Post Only or IOC.');
            return;
        }

        if (postOnly && ioc) {
            setFormError('Post Only and IOC cannot be enabled together.');
            return;
        }

        onPlaceOrder({
            side,
            orderType,
            price: orderType === 'LIMIT' ? parsedPrice : 0,
            quantity: parsedQuantity,
            postOnly: orderType === 'LIMIT' ? postOnly : false,
            ioc: orderType === 'LIMIT' ? ioc : false
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
                <button type="button" onClick={() => handleOrderTypeChange('LIMIT')} className={`pb-1 font-bold ${orderType === 'LIMIT' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Limit</button>
                <button type="button" onClick={() => handleOrderTypeChange('MARKET')} className={`pb-1 font-bold ${orderType === 'MARKET' ? 'text-[#0ecb81] border-b-2 border-[#0ecb81]' : 'text-[#848e9c]'}`}>Market</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                {orderType === 'LIMIT' && (
                    <div className="space-y-1">
                        <label className="text-[10px] text-[#707a8a] font-bold uppercase">Price</label>
                        <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                            <input type="number" min="0.01" step="0.01" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setFormError(''); }} className="w-full bg-transparent p-2 text-xs outline-none text-[#eaecef]" />
                            <span className="absolute right-3 font-bold text-[#707a8a] text-[9px]">USDC</span>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] text-[#707a8a] font-bold uppercase">Quantity</label>
                    <div className="relative flex items-center bg-[#161a1e] border border-[#2b3139] rounded focus-within:border-[#475262]">
                        <input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={quantity} onChange={(e) => { setQuantity(e.target.value); setFormError(''); }} className="w-full bg-transparent p-2 text-xs outline-none text-[#eaecef]" required />
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

                {formError && (
                    <div className="rounded border border-[#f6465d]/30 bg-[#f6465d]/10 p-2 font-mono text-[10px] text-[#f6465d]">
                        {formError}
                    </div>
                )}

                <button type="submit" disabled={loading || !userId || !formIsValid} className={`w-full py-2.5 rounded text-xs font-bold text-[#0b0e11] mt-2 shadow transition-all ${side === 'BUY' ? 'bg-[#0ecb81] hover:bg-[#0bba74]' : 'bg-[#f6465d] hover:bg-[#e03f54]'} ${loading || !userId || !formIsValid ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    {loading ? 'Routing Ticket...' : `${side === 'BUY' ? 'Buy' : 'Sell'} SOL`}
                </button>
            </form>
        </div>
    )
}
