"use client"

import { useEffect, useState } from "react";
import { Orderbook } from '@exchange/types';

export function useOrderbook() {
    const [orderbook, setOrderbook] = useState<Orderbook>({ bids: {}, asks: {} });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080';
        let ws: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let shouldReconnect = true;

        const connect = () => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => setConnected(true);

            ws.onclose = () => {
                setConnected(false);
                if (shouldReconnect) {
                    reconnectTimer = setTimeout(connect, 1000);
                }
            };

            ws.onerror = () => {
                ws?.close();
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.stream === 'exchange:market:data') {
                    setOrderbook(message.data.depth);
                }
            };
        };

        connect();

        return () => {
            shouldReconnect = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            ws?.close();
        };
    }, []);

    return { orderbook, connected };
}
