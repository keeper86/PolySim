'use client';

import { useEffect, useRef, useState } from 'react';
import { trpcClient } from '@/app/clientTrpc';
import { clientLogger } from '@/app/clientLogger';

const log = clientLogger.child('useRealtimeMessages');

type Message = {
    id: number;
    conversation_id: number;
    sender_id: string;
    content: string;
    created_at: string;
};

export default function useRealtimeMessages(conversationId: number | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!conversationId) {
            return;
        }
        let mounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const data = await trpcClient['messages-get'].query({ conversationId });
                if (!mounted) {
                    return;
                }
                setMessages(data);
                log.success('Loaded messages');
            } catch (err) {
                log.error('Failed to load messages', err);
            } finally {
                setLoading(false);
            }
        };

        void load();

        // Prefer server-side proxied realtime via WebSocket, fall back to SSE.
        const realtimeWsUrl =
            (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REALTIME_URL) || `/api/realtime`;
        const realtimeSseUrl =
            (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REALTIME_SSE_URL) || `/api/realtime/sse`;

        const connectWebSocket = () => {
            try {
                const url = new URL(realtimeWsUrl, window.location.href);
                if (conversationId) {
                    url.searchParams.set('conversationId', String(conversationId));
                }
                const ws = new WebSocket(url.toString());
                wsRef.current = ws;

                ws.addEventListener('open', () => log.info('Realtime WS open'));
                ws.addEventListener('message', (ev) => {
                    try {
                        const payload = JSON.parse(ev.data);
                        if (payload && payload.type === 'message' && payload.data) {
                            const newMsg = payload.data as Message;
                            setMessages((prev) => [...prev, { ...newMsg, created_at: newMsg.created_at }]);
                        }
                    } catch {
                        // ignore parse errors
                    }
                });
                ws.addEventListener('close', () => log.info('Realtime WS closed'));
                ws.addEventListener('error', () => {
                    log.info('Realtime WS error, falling back to SSE');
                    connectSSE();
                });
            } catch (e) {
                log.info('WS connect failed, falling back to SSE', e);
                connectSSE();
            }
        };

        const connectSSE = () => {
            try {
                const url = new URL(realtimeSseUrl, window.location.href);
                if (conversationId) {
                    url.searchParams.set('conversationId', String(conversationId));
                }
                const es = new EventSource(url.toString());
                esRef.current = es;
                es.addEventListener('message', (ev) => {
                    try {
                        const payload = JSON.parse(ev.data);
                        // payload is the raw message object
                        const newMsg = payload as Message;
                        setMessages((prev) => [...prev, { ...newMsg, created_at: newMsg.created_at }]);
                    } catch {
                        // ignore
                    }
                });
                es.addEventListener('open', () => log.info('Realtime SSE open'));
                es.addEventListener('error', (err) => log.info('Realtime SSE error', err));
            } catch (e) {
                log.error('SSE connect failed', e);
            }
        };

        // Start with WebSocket then SSE fallback
        connectWebSocket();

        return () => {
            mounted = false;
            try {
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }
            } catch {
                // ignore
            }
            try {
                if (esRef.current) {
                    esRef.current.close();
                    esRef.current = null;
                }
            } catch {
                // ignore
            }
        };
    }, [conversationId]);

    return { messages, loading, setMessages };
}
