"use client"

import { useEffect, useState } from "react";
import { Orderbook } from '@exchange/types';

export interface LiveTrade {
    id?: string;
    buyer: string;
    seller: string;
    price: number;
    quantity: number;
    timestamp: number;
}

interface TradesResponse {
    success?: boolean;
    trades?: LiveTrade[];
}

function normalizeTrade(trade: LiveTrade): LiveTrade | null {
    const normalized = {
        id: trade.id,
        buyer: trade.buyer,
        seller: trade.seller,
        price: Number(trade.price),
        quantity: Number(trade.quantity),
        timestamp: Number(trade.timestamp),
    };

    if (
        !normalized.buyer ||
        !normalized.seller ||
        !Number.isFinite(normalized.price) ||
        !Number.isFinite(normalized.quantity) ||
        !Number.isFinite(normalized.timestamp)
    ) {
        return null;
    }

    return normalized;
}

function getTradeKey(trade: LiveTrade) {
    return trade.id ?? `${trade.buyer}:${trade.seller}:${trade.price}:${trade.quantity}:${trade.timestamp}`;
}

function mergeTrades(previousTrades: LiveTrade[], incomingTrades: LiveTrade[]) {
    const byKey = new Map<string, LiveTrade>();

    for (const trade of [...incomingTrades, ...previousTrades]) {
        byKey.set(getTradeKey(trade), trade);
    }

    return Array.from(byKey.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 500);
}

export function useOrderbook() {
    const [orderbook, setOrderbook] = useState<Orderbook>({ bids: {}, asks: {} });
    const [trades, setTrades] = useState<LiveTrade[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadRecentTrades() {
            try {
                const res = await fetch('/api/market/trades?limit=500');
                const data = (await res.json()) as TradesResponse;
                const hydratedTrades = (data.trades ?? [])
                    .map((trade) => normalizeTrade(trade))
                    .filter((trade): trade is LiveTrade => trade !== null);

                if (!cancelled && data.success && hydratedTrades.length > 0) {
                    setTrades((previousTrades) => mergeTrades(previousTrades, hydratedTrades));
                }
            } catch (error) {
                console.error('Failed to hydrate recent market trades:', error);
            }
        }

        loadRecentTrades();

        return () => {
            cancelled = true;
        };
    }, []);

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

                if (message.stream === 'exchange:order:updates' && Array.isArray(message.data?.trades)) {
                    const incomingTrades = message.data.trades
                        .map((trade: LiveTrade) => normalizeTrade(trade))
                        .filter((trade: LiveTrade | null): trade is LiveTrade => trade !== null);

                    if (incomingTrades.length > 0) {
                        setTrades((previousTrades) => mergeTrades(previousTrades, incomingTrades));
                    }
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

    return { orderbook, trades, connected };
}
