export interface Order {
    id: string;
    price: number;
    quantity: number;
    side: 'BUY' | 'SELL';
    userId: string;
    timestamp: number;
}

export interface OrderbookSide {
    [price: number]: Order[];
}

export interface Orderbook {
    bids: OrderbookSide;
    asks: OrderbookSide;
}

export interface UserBalance {
    available: number;
    locked: number;
}

export interface Balances {
    [userId: string]: {
        [asset: string]: UserBalance;
    };
}