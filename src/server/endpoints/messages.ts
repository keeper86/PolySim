import { z } from 'zod';
import { db } from '../db';
import { logger } from '../logger';
import type { ProcedureBuilderType } from '../router';

// Schema for a message
const MessageSchema = z.object({
    id: z.number(),
    conversation_id: z.number(),
    sender_id: z.string(),
    content: z.string(),
    created_at: z.string(),
});

// Schema for a conversation
const ConversationSchema = z.object({
    id: z.number(),
    name: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    last_message: z.string().nullable(),
    last_message_at: z.string().nullable(),
});

// Get all conversations for the current user
export const getConversations = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Messages'],
                summary: 'Get user conversations',
                description: 'Get all conversations the user is a participant in',
            },
        })
        .input(z.void())
        .output(z.array(ConversationSchema))
        .query(async ({ ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId }, 'Getting conversations');

            const conversations = await db('conversations')
                .select(
                    'conversations.id',
                    'conversations.name',
                    'conversations.created_at',
                    'conversations.updated_at',
                    db.raw('(SELECT content FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_message'),
                    db.raw('(SELECT created_at FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_message_at')
                )
                .join('conversation_participants', 'conversations.id', 'conversation_participants.conversation_id')
                .where('conversation_participants.user_id', userId)
                .orderBy('conversations.updated_at', 'desc');

            return conversations.map((conv) => ({
                ...conv,
                created_at: conv.created_at.toISOString(),
                updated_at: conv.updated_at.toISOString(),
                last_message_at: conv.last_message_at ? new Date(conv.last_message_at).toISOString() : null,
            }));
        });
};

// Get messages for a specific conversation
export const getMessages = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Messages'],
                summary: 'Get conversation messages',
                description: 'Get all messages in a conversation',
            },
        })
        .input(
            z.object({
                conversationId: z.number(),
                limit: z.number().optional().default(100),
                offset: z.number().optional().default(0),
            })
        )
        .output(z.array(MessageSchema))
        .query(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, conversationId: input.conversationId }, 'Getting messages');

            // Verify user is a participant in this conversation
            const participant = await db('conversation_participants')
                .where({ conversation_id: input.conversationId, user_id: userId })
                .first();

            if (!participant) {
                throw new Error('Not a participant in this conversation');
            }

            const messages = await db('messages')
                .where({ conversation_id: input.conversationId })
                .orderBy('created_at', 'asc')
                .limit(input.limit)
                .offset(input.offset);

            return messages.map((msg) => ({
                ...msg,
                created_at: msg.created_at.toISOString(),
            }));
        });
};

// Send a message to a conversation
export const sendMessage = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'POST',
                path,
                tags: ['Messages'],
                summary: 'Send a message',
                description: 'Send a message to a conversation',
            },
        })
        .input(
            z.object({
                conversationId: z.number(),
                content: z.string().min(1, 'Message content is required'),
            })
        )
        .output(MessageSchema)
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, conversationId: input.conversationId }, 'Sending message');

            // Verify user is a participant in this conversation
            const participant = await db('conversation_participants')
                .where({ conversation_id: input.conversationId, user_id: userId })
                .first();

            if (!participant) {
                throw new Error('Not a participant in this conversation');
            }

            // Insert the message
            const [message] = await db('messages')
                .insert({
                    conversation_id: input.conversationId,
                    sender_id: userId,
                    content: input.content,
                })
                .returning('*');

            // Update conversation's updated_at timestamp
            await db('conversations')
                .where({ id: input.conversationId })
                .update({ updated_at: db.fn.now() });

            return {
                ...message,
                created_at: message.created_at.toISOString(),
            };
        });
};

// Create a new conversation
export const createConversation = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'POST',
                path,
                tags: ['Messages'],
                summary: 'Create a conversation',
                description: 'Create a new conversation with participants',
            },
        })
        .input(
            z.object({
                name: z.string().min(1, 'Conversation name is required'),
                participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
            })
        )
        .output(ConversationSchema)
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, name: input.name }, 'Creating conversation');

            // Create the conversation
            const [conversation] = await db('conversations')
                .insert({ name: input.name })
                .returning('*');

            // Add the creator as a participant
            const participantIds = new Set([userId, ...input.participantIds]);

            await db('conversation_participants').insert(
                Array.from(participantIds).map(participantId => ({
                    conversation_id: conversation.id,
                    user_id: participantId,
                }))
            );

            return {
                ...conversation,
                created_at: conversation.created_at.toISOString(),
                updated_at: conversation.updated_at.toISOString(),
                last_message: null,
                last_message_at: null,
            };
        });
};
