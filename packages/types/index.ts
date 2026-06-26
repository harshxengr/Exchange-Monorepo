export interface Order {
    id: string;
    price: number;
    quantity: number;
    side: 'BUY' | 'SELL';
    userId: string;
    timestamp: number;
    orderType?: 'LIMIT' | 'MARKET';
    postOnly?: boolean;
    ioc?: boolean;
}

export interface AccountInitialization {
    type: 'ACCOUNT_INIT';
    userId: string;
    balances: {
        asset: string;
        amount: number;
    }[];
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