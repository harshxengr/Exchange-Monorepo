import { Order, Balances } from '@exchange/types';

export interface ExecutionOrder extends Order {
    orderType?: 'LIMIT' | 'MARKET';
    postOnly?: boolean;
    ioc?: boolean;
}

export class Orderbook {
    private bids: { [price: number]: ExecutionOrder[] } = {};
    private asks: { [price: number]: ExecutionOrder[] } = {};
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

    public processOrder(order: ExecutionOrder) {
        const { side, price, quantity, userId, orderType = 'LIMIT', postOnly = false, ioc = false } = order;

        if (postOnly && ioc) {
            throw new Error('Post-only and IOC cannot be enabled together');
        }

        if (orderType === 'MARKET' && (postOnly || ioc)) {
            throw new Error('Market orders do not support post-only or IOC flags');
        }

        if (orderType === 'LIMIT' && price <= 0) {
            throw new Error('Limit orders require a price greater than zero');
        }

        if (orderType === 'MARKET' && side === 'BUY') {
            const maxExecutableCost = this.getMarketBuyCost(quantity);
            const usdBalance = this.getBalance(userId, this.quoteAsset);
            if (maxExecutableCost > usdBalance.available) {
                throw new Error('Insufficient USD balance for market execution');
            }
        }

        // 1. Pre-Execution Balance Locking Checks
        if (orderType === 'LIMIT') {
            if (side === 'BUY') {
                const cost = price * quantity;
                const usdBalance = this.getBalance(userId, this.quoteAsset);
                if (usdBalance.available < cost) throw new Error('Insufficient USD balance');
                usdBalance.available -= cost;
                usdBalance.locked += cost;
            } else {
                const cryptoBalance = this.getBalance(userId, this.baseAsset);
                if (cryptoBalance.available < quantity) throw new Error('Insufficient crypto balance');
                cryptoBalance.available -= quantity;
                cryptoBalance.locked += quantity;
            }
        } else {
            // MARKET validation check matching profile liquid baseline directly
            if (side === 'SELL') {
                const cryptoBalance = this.getBalance(userId, this.baseAsset);
                if (cryptoBalance.available < quantity) throw new Error('Insufficient crypto balance for market execution');
                cryptoBalance.available -= quantity;
            }
        }

        // 2. Check Post-Only condition before match loops run
        if (postOnly && orderType === 'LIMIT') {
            const hasMatchingAsks = side === 'BUY' && Object.keys(this.asks).map(Number).some(p => p <= price);
            const hasMatchingBids = side === 'SELL' && Object.keys(this.bids).map(Number).some(p => p >= price);
            if (hasMatchingAsks || hasMatchingBids) {
                // Post-only orders must add liquidity, so cancel immediately if it would cross a resting order
                if (side === 'BUY') {
                    const usdBalance = this.getBalance(userId, this.quoteAsset);
                    usdBalance.available += (price * quantity);
                    usdBalance.locked -= (price * quantity);
                } else {
                    const cryptoBalance = this.getBalance(userId, this.baseAsset);
                    cryptoBalance.available += quantity;
                    cryptoBalance.locked -= quantity;
                }
                throw new Error('POST_ONLY_RESTRICTION_TRIGGERED');
            }
        }

        const trades: any[] = [];
        let remainingQty = quantity;

        // 3. Execution Processing Core Match Loop
        if (side === 'BUY') {
            const askPrices = Object.keys(this.asks).map(Number).sort((a, b) => a - b);

            for (const askPrice of askPrices) {
                if (orderType === 'LIMIT' && askPrice > price) break;
                if (remainingQty <= 0) break;

                const orderLine = this.asks[askPrice];
                while (orderLine.length > 0 && remainingQty > 0) {
                    const activeAsk = orderLine[0];
                    const matchQty = Math.min(remainingQty, activeAsk.quantity);

                    remainingQty -= matchQty;
                    activeAsk.quantity -= matchQty;

                    // Settle asset distribution balances internally
                    if (orderType === 'MARKET') {
                        const totalCost = askPrice * matchQty;
                        const buyerUSD = this.getBalance(userId, this.quoteAsset);
                        if (buyerUSD.available < totalCost) throw new Error('Insufficient USD to continue market fill');
                        buyerUSD.available -= totalCost;
                        this.getBalance(userId, this.baseAsset).available += matchQty;

                        const sellerCrypto = this.getBalance(activeAsk.userId, this.baseAsset);
                        sellerCrypto.locked -= matchQty;
                        this.getBalance(activeAsk.userId, this.quoteAsset).available += totalCost;
                    } else {
                        this.settleTrade(userId, activeAsk.userId, askPrice, matchQty);
                        if (price > askPrice) {
                            const priceImprovement = (price - askPrice) * matchQty;
                            const buyerUSD = this.getBalance(userId, this.quoteAsset);
                            buyerUSD.locked -= priceImprovement;
                            buyerUSD.available += priceImprovement;
                        }
                    }

                    trades.push({
                        buyer: userId,
                        seller: activeAsk.userId,
                        price: askPrice,
                        quantity: matchQty,
                        timestamp: Date.now()
                    });

                    if (activeAsk.quantity === 0) orderLine.shift();
                }
                if (orderLine.length === 0) delete this.asks[askPrice];
            }

            // Book resting balance tracking parameters if limit order type wasn't canceled via IOC rules
            if (remainingQty > 0 && orderType === 'LIMIT' && !ioc) {
                order.quantity = remainingQty;
                if (!this.bids[price]) this.bids[price] = [];
                this.bids[price].push(order);
            } else if (remainingQty > 0 && orderType === 'LIMIT' && ioc) {
                // Return unused locked funds if immediate or cancel failed to fill completely
                const unusedCost = price * remainingQty;
                const usdBalance = this.getBalance(userId, this.quoteAsset);
                usdBalance.available += unusedCost;
                usdBalance.locked -= unusedCost;
            }

        } else {
            // SELL SIDE EXECUTION LOGIC MATRIX
            const bidPrices = Object.keys(this.bids).map(Number).sort((a, b) => b - a);

            for (const bidPrice of bidPrices) {
                if (orderType === 'LIMIT' && bidPrice < price) break;
                if (remainingQty <= 0) break;

                const orderLine = this.bids[bidPrice];
                while (orderLine.length > 0 && remainingQty > 0) {
                    const activeBid = orderLine[0];
                    const matchQty = Math.min(remainingQty, activeBid.quantity);

                    remainingQty -= matchQty;
                    activeBid.quantity -= matchQty;

                    if (orderType === 'MARKET') {
                        const totalCost = bidPrice * matchQty;
                        this.getBalance(userId, this.quoteAsset).available += totalCost;

                        const buyerUSD = this.getBalance(activeBid.userId, this.quoteAsset);
                        buyerUSD.locked -= totalCost;
                        this.getBalance(activeBid.userId, this.baseAsset).available += matchQty;
                    } else {
                        this.settleTrade(activeBid.userId, userId, bidPrice, matchQty);
                    }

                    trades.push({
                        buyer: activeBid.userId,
                        seller: userId,
                        price: bidPrice,
                        quantity: matchQty,
                        timestamp: Date.now()
                    });

                    if (activeBid.quantity === 0) orderLine.shift();
                }
                if (orderLine.length === 0) delete this.bids[bidPrice];
            }

            if (remainingQty > 0 && orderType === 'LIMIT' && !ioc) {
                order.quantity = remainingQty;
                if (!this.asks[price]) this.asks[price] = [];
                this.asks[price].push(order);
            } else if (remainingQty > 0 && orderType === 'LIMIT' && ioc) {
                const cryptoBalance = this.getBalance(userId, this.baseAsset);
                cryptoBalance.available += remainingQty;
                cryptoBalance.locked -= remainingQty;
            }

            if (remainingQty > 0 && orderType === 'MARKET') {
                const cryptoBalance = this.getBalance(userId, this.baseAsset);
                cryptoBalance.available += remainingQty;
            }
        }

        return { trades, remainingQty, filledQty: quantity - remainingQty };
    }

    private getMarketBuyCost(quantity: number) {
        let remainingQty = quantity;
        let totalCost = 0;
        const askPrices = Object.keys(this.asks).map(Number).sort((a, b) => a - b);

        for (const askPrice of askPrices) {
            if (remainingQty <= 0) break;

            const orderLine = this.asks[askPrice];
            for (const ask of orderLine) {
                if (remainingQty <= 0) break;
                const matchQty = Math.min(remainingQty, ask.quantity);
                totalCost += askPrice * matchQty;
                remainingQty -= matchQty;
            }
        }

        return totalCost;
    }

    private settleTrade(buyerId: string, sellerId: string, price: number, quantity: number) {
        const totalCost = price * quantity;
        this.getBalance(buyerId, this.quoteAsset).locked -= totalCost;
        this.getBalance(buyerId, this.baseAsset).available += quantity;
        this.getBalance(sellerId, this.baseAsset).locked -= quantity;
        this.getBalance(sellerId, this.quoteAsset).available += totalCost;
    }

    public getDepth() {
        return { bids: this.bids, asks: this.asks };
    }
}
