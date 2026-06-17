import { Order, Orderbook as IOrderbook, Balances } from '@exchange/types';

export class Orderbook {
    private bids: { [price: number]: Order[] } = {};
    private asks: { [price: number]: Order[] } = {};
    private balances: Balances = {};
    private baseAsset: string;
    private quoteAsset: string;

    constructor(baseAsset: string, quoteAsset: string) {
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
    }

    public getBalance(userId: string, asset: string) {
        if (!this.balances[userId]) this.balances[userId] = {};
        if (!this.balances[userId][asset]) {
            this.balances[userId][asset] = { available: 0, locked: 0 };
        }
        return this.balances[userId][asset];
    }

    public deposit(userId: string, asset: string, amount: number) {
        const balance = this.getBalance(userId, asset);
        balance.available += amount;
    }

    public processOrder(order: Order) {
        const { side, price, quantity, userId } = order;

        if (side === 'BUY') {
            const cost = price * quantity;
            const usdBalance = this.getBalance(userId, this.quoteAsset);
            if (usdBalance.available < cost) throw new Error('Insufficient USD balance');
            usdBalance.available -= cost;
            usdBalance.locked += cost;
        } else {
            const btcBalance = this.getBalance(userId, this.baseAsset);
            if (btcBalance.available < quantity) throw new Error('Insufficient crypto balance');
            btcBalance.available -= quantity;
            btcBalance.locked += quantity;
        }

        const trades: any[] = [];
        let remainingQty = quantity;

        if (side === 'BUY') {
            const askPrices = Object.keys(this.asks).map(Number).sort((a, b) => a - b);

            for (const askPrice of askPrices) {
                if (askPrice > price || remainingQty <= 0) break;

                const orderLine = this.asks[askPrice];
                while (orderLine.length > 0 && remainingQty > 0) {
                    const activeAsk = orderLine[0];
                    const matchQty = Math.min(remainingQty, activeAsk.quantity);

                    remainingQty -= matchQty;
                    activeAsk.quantity -= matchQty;

                    this.settleTrade(userId, activeAsk.userId, askPrice, matchQty);

                    trades.push({
                        buyer: userId,
                        seller: activeAsk.userId,
                        price: askPrice,
                        quantity: matchQty,
                        timestamp: Date.now()
                    });

                    if (activeAsk.quantity === 0) {
                        orderLine.shift();
                    }
                }
                if (orderLine.length === 0) delete this.asks[askPrice];
            }

            if (remainingQty > 0) {
                order.quantity = remainingQty;
                if (!this.bids[price]) this.bids[price] = [];
                this.bids[price].push(order);
            }

        } else {
            const bidPrices = Object.keys(this.bids).map(Number).sort((a, b) => b - a);

            for (const bidPrice of bidPrices) {
                if (bidPrice < price || remainingQty <= 0) break;

                const orderLine = this.bids[bidPrice];
                while (orderLine.length > 0 && remainingQty > 0) {
                    const activeBid = orderLine[0];
                    const matchQty = Math.min(remainingQty, activeBid.quantity);

                    remainingQty -= matchQty;
                    activeBid.quantity -= matchQty;

                    this.settleTrade(activeBid.userId, userId, bidPrice, matchQty);

                    trades.push({
                        buyer: activeBid.userId,
                        seller: userId,
                        price: bidPrice,
                        quantity: matchQty,
                        timestamp: Date.now()
                    });

                    if (activeBid.quantity === 0) {
                        orderLine.shift();
                    }
                }
                if (orderLine.length === 0) delete this.bids[bidPrice];
            }

            if (remainingQty > 0) {
                order.quantity = remainingQty;
                if (!this.asks[price]) this.asks[price] = [];
                this.asks[price].push(order);
            }
        }

        return { trades, remainingQty };
    }

    private settleTrade(buyerId: string, sellerId: string, price: number, quantity: number) {
        const totalCost = price * quantity;

        const buyerUSD = this.getBalance(buyerId, this.quoteAsset);
        const buyerBTC = this.getBalance(buyerId, this.baseAsset);
        const sellerUSD = this.getBalance(sellerId, this.quoteAsset);
        const sellerBTC = this.getBalance(sellerId, this.baseAsset);

        buyerUSD.locked -= totalCost;
        buyerBTC.available += quantity;

        sellerBTC.locked -= quantity;
        sellerUSD.available += totalCost;
    }

    public getDepth() {
        return { bids: this.bids, asks: this.asks };
    }
}