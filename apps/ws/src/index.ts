import { WebSocketServer, WebSocket } from 'ws';
import { createRedisClient, REDIS_CHANNELS } from '@exchange/redis';
import { env } from '@exchange/env';

const PORT = Number(env.WS_PORT) || 8080;

const wss = new WebSocketServer({ port: PORT });

const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
    connectedClients.add(ws);
    console.log(`Client connected. Total active listening nodes: ${connectedClients.size}`);

    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log(`Client disconnected. Total active listening nodes: ${connectedClients.size}`);
    });

    ws.on('error', (err) => {
        console.error('Individual Client Socket Error:', err);
        connectedClients.delete(ws);
    });
});

const redisSubscriber = createRedisClient();

async function initRedisSubscriptionHub() {
    await redisSubscriber.subscribe(
        REDIS_CHANNELS.ORDER_UPDATES,
        REDIS_CHANNELS.MARKET_DATA
    );

    console.log(`WebSocket Node successfully listening to Redis Pub/Sub channels...`);

    redisSubscriber.on('message', (channel, message) => {
        console.log(`Received Redis message from channel [${channel}]`);

        const outgoingPayload = JSON.stringify({
            stream: channel,
            data: JSON.parse(message),
            emittedAt: Date.now()
        });

        for (const client of connectedClients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(outgoingPayload);
            }
        }
    });
}

initRedisSubscriptionHub().catch((err) => {
    console.error('Failed to initialize internal event stream listener network:', err);
});

console.log(`Live Streaming Exchange WebSocket operational on ws://localhost:${PORT}`);