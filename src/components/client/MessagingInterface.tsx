'use client';

import { trpcClient } from '@/app/clientTrpc';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { clientLogger } from '@/app/clientLogger';
import { MessageSquare, Send, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import useRealtimeMessages from '@/hooks/useRealtimeMessages';

const log = clientLogger.child('MessagingInterface');

type Conversation = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    last_message: string | null;
    last_message_at: string | null;
};

export default function MessagingInterface() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newConversationName, setNewConversationName] = useState('');
    const [newConversationParticipants, setNewConversationParticipants] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages } = useRealtimeMessages(selectedConversation);

    const userId = session?.user?.email || session?.user?.name || 'unknown';

    // Load conversations on mount
    useEffect(() => {
        void loadConversations();
    }, []);

    // when selectedConversation changes, our hook already loads messages and subscribes
    useEffect(() => {
        if (selectedConversation) {
            // sync hook messages into local state for convenience
            // handled by hook; no-op here
        }
    }, [selectedConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const data = await trpcClient['conversations-get'].query();
            setConversations(data);
            log.success('Loaded conversations', undefined, { show: false });
        } catch (error) {
            log.error('Failed to load conversations', error);
        }
    };

    // message loading is handled by the hook

    const sendMessage = async () => {
        if (!selectedConversation || !newMessage.trim()) {
            return;
        }

        setLoading(true);
        try {
            await trpcClient['messages-send'].mutate({
                conversationId: selectedConversation,
                content: newMessage,
            });
            // Message will be added via realtime subscription
            setNewMessage('');
            void loadConversations(); // Refresh to update last message
            log.success('Message sent', undefined, { show: false });
        } catch (error) {
            log.error('Failed to send message', error);
        } finally {
            setLoading(false);
        }
    };

    const createConversation = async () => {
        if (!newConversationName.trim()) {
            return;
        }

        setLoading(true);
        try {
            const participantIds = newConversationParticipants
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

            const conversation = await trpcClient['conversations-create'].mutate({
                name: newConversationName,
                participantIds: participantIds.length > 0 ? participantIds : [userId],
            });

            setConversations([conversation, ...conversations]);
            setNewConversationName('');
            setNewConversationParticipants('');
            setShowNewConversation(false);
            setSelectedConversation(conversation.id);
            log.success('Conversation created', undefined, { show: true });
        } catch (error) {
            log.error('Failed to create conversation', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return format(date, 'HH:mm');
        } else {
            return format(date, 'MMM d, HH:mm');
        }
    };

    return (
        <div className='flex h-[calc(100vh-10rem)] border rounded-lg overflow-hidden'>
            {/* Conversations Sidebar */}
            <div className='w-80 border-r flex flex-col'>
                <div className='p-4 border-b'>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='font-semibold flex items-center gap-2'>
                            <MessageSquare className='h-5 w-5' />
                            Conversations
                        </h2>
                        <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setShowNewConversation(!showNewConversation)}
                        >
                            <Plus className='h-4 w-4' />
                        </Button>
                    </div>

                    {showNewConversation && (
                        <div className='space-y-2 mt-4 p-3 border rounded-lg bg-muted/50'>
                            <Input
                                placeholder='Conversation name'
                                value={newConversationName}
                                onChange={(e) => setNewConversationName(e.target.value)}
                            />
                            <Input
                                placeholder='Participants (comma-separated)'
                                value={newConversationParticipants}
                                onChange={(e) => setNewConversationParticipants(e.target.value)}
                            />
                            <div className='flex gap-2'>
                                <Button
                                    size='sm'
                                    onClick={createConversation}
                                    disabled={loading || !newConversationName.trim()}
                                    className='flex-1'
                                >
                                    Create
                                </Button>
                                <Button size='sm' variant='outline' onClick={() => setShowNewConversation(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollArea className='flex-1'>
                    {conversations.length === 0 ? (
                        <div className='p-4 text-center text-muted-foreground'>
                            <Users className='h-12 w-12 mx-auto mb-2 opacity-50' />
                            <p className='text-sm'>No conversations yet</p>
                            <p className='text-xs mt-1'>Create one to get started</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                                    selectedConversation === conv.id ? 'bg-muted' : ''
                                }`}
                                onClick={() => setSelectedConversation(conv.id)}
                            >
                                <div className='flex justify-between items-start mb-1'>
                                    <h3 className='font-medium truncate'>{conv.name}</h3>
                                    {conv.last_message_at && (
                                        <span className='text-xs text-muted-foreground'>
                                            {formatMessageTime(conv.last_message_at)}
                                        </span>
                                    )}
                                </div>
                                {conv.last_message && (
                                    <p className='text-sm text-muted-foreground truncate'>{conv.last_message}</p>
                                )}
                            </div>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className='flex-1 flex flex-col'>
                {selectedConversation ? (
                    <>
                        <div className='p-4 border-b'>
                            <h2 className='font-semibold'>
                                {conversations.find((c) => c.id === selectedConversation)?.name}
                            </h2>
                        </div>

                        <ScrollArea className='flex-1 p-4'>
                            {messages.length === 0 ? (
                                <div className='text-center text-muted-foreground py-8'>
                                    <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
                                    <p>No messages yet</p>
                                    <p className='text-sm mt-1'>Be the first to send a message</p>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    {messages.map((msg) => {
                                        const isOwnMessage = msg.sender_id === userId;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${
                                                        isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                    }`}
                                                >
                                                    {!isOwnMessage && (
                                                        <p className='text-xs font-medium mb-1 opacity-70'>
                                                            {msg.sender_id}
                                                        </p>
                                                    )}
                                                    <p className='break-words'>{msg.content}</p>
                                                    <p
                                                        className={`text-xs mt-1 ${
                                                            isOwnMessage ? 'opacity-70' : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {formatMessageTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        <Separator />

                        <div className='p-4'>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void sendMessage();
                                }}
                                className='flex gap-2'
                            >
                                <Input
                                    placeholder='Type a message...'
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={loading}
                                    className='flex-1'
                                />
                                <Button type='submit' disabled={loading || !newMessage.trim()}>
                                    <Send className='h-4 w-4' />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className='flex-1 flex items-center justify-center text-muted-foreground'>
                        <div className='text-center'>
                            <MessageSquare className='h-16 w-16 mx-auto mb-4 opacity-50' />
                            <p className='text-lg font-medium'>Select a conversation</p>
                            <p className='text-sm mt-1'>Choose a conversation from the sidebar to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
