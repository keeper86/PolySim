'use client';

import { useEffect, useState } from 'react';
import { trpcClient } from '@/app/clientTrpc';
import { clientLogger } from '@/app/clientLogger';
import { createClient } from '@supabase/supabase-js';

const log = clientLogger.child('useRealtimeMessages');

type Message = {
    id: number;
    conversation_id: number;
    sender_id: string;
    content: string;
    created_at: string;
};

// Create Supabase client for realtime subscriptions
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    return createClient(supabaseUrl, supabaseKey, {
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
};

export default function useRealtimeMessages(conversationId: number | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        let mounted = true;
        const supabase = getSupabaseClient();

        const load = async () => {
            setLoading(true);
            try {
                const data = await trpcClient['messages-get'].query({ conversationId });
                if (!mounted) {
                    return;
                }
                setMessages(data);
                log.success('Loaded messages', undefined, { show: false });
            } catch (err) {
                log.error('Failed to load messages', err);
            } finally {
                setLoading(false);
            }
        };

        void load();

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`messages:conversation_id=eq.${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    log.info('New message via Supabase Realtime', payload);
                    const newMsg = payload.new as Message;
                    if (mounted && newMsg) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }
            )
            .subscribe((status) => {
                log.info(`Supabase subscription status: ${status}`);
            });

        return () => {
            mounted = false;
            void supabase.removeChannel(channel);
        };
    }, [conversationId]);

    return { messages, loading, setMessages };
}

