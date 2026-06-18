"use client"

import { useEffect, useState } from "react";
import { Orderbook } from '@exchange/types';

export function useOrderbook() {
    const [orderbook, setOrderbook] = useState<Orderbook>({ bids: {}, asks: {} });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.stream === 'exchange:market:data') {
                setOrderbook(message.data.depth);
            }
        };

        return () => ws.close();
    }, []);

    return { orderbook, connected };
}