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

// Table name constants to avoid magic strings
const TABLES = {
    conversationParticipants: 'conversation_participants',
    messages: 'messages',
    conversations: 'conversations',
};

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

            // Get all conversation IDs for this user using direct database access
            const participantRows = await db(TABLES.conversationParticipants)
                .select('conversation_id')
                .where('user_id', userId);

            const conversationIds = participantRows.map((row) => row.conversation_id);
            if (conversationIds.length === 0) {
                return [];
            }

            // Fetch conversations for these IDs
            const conversations = await db(TABLES.conversations)
                .select('*')
                .whereIn('id', conversationIds)
                .orderBy('updated_at', 'desc');

            // For each conversation, fetch the last message (content and created_at)
            const results = await Promise.all(
                conversations.map(async (conv) => {
                    const lastMsg = await db(TABLES.messages)
                        .select('content', 'created_at')
                        .where('conversation_id', conv.id)
                        .orderBy('created_at', 'desc')
                        .limit(1)
                        .first();

                    return {
                        ...conv,
                        created_at: new Date(conv.created_at).toISOString(),
                        updated_at: new Date(conv.updated_at).toISOString(),
                        last_message: lastMsg ? lastMsg.content : null,
                        last_message_at: lastMsg ? new Date(lastMsg.created_at).toISOString() : null,
                    };
                }),
            );
            return results;
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
            }),
        )
        .output(z.array(MessageSchema))
        .query(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, conversationId: input.conversationId }, 'Getting messages');

            // Verify user is a participant in this conversation
            const participant = await db(TABLES.conversationParticipants)
                .select('*')
                .where('conversation_id', input.conversationId)
                .where('user_id', userId)
                .first();

            if (!participant) {
                throw new Error('Not a participant in this conversation');
            }

            const messages = await db(TABLES.messages)
                .select('*')
                .where('conversation_id', input.conversationId)
                .orderBy('created_at', 'asc')
                .limit(input.limit)
                .offset(input.offset);

            return messages.map((msg) => ({
                ...msg,
                created_at: new Date(msg.created_at).toISOString(),
            }));
        });
};

// Send a message to a conversation (Supabase-powered)
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
            }),
        )
        .output(MessageSchema)
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, conversationId: input.conversationId }, 'Sending message');

            // Verify user is a participant in this conversation
            const participant = await db(TABLES.conversationParticipants)
                .select('*')
                .where('conversation_id', input.conversationId)
                .where('user_id', userId)
                .first();

            if (!participant) {
                throw new Error('Not a participant in this conversation');
            }

            const [message] = await db(TABLES.messages)
                .insert({
                    conversation_id: input.conversationId,
                    sender_id: userId,
                    content: input.content,
                })
                .returning('*');

            // Update conversation's updated_at timestamp
            await db(TABLES.conversations).update({ updated_at: db.fn.now() }).where('id', input.conversationId);

            return {
                ...message,
                created_at: new Date(message.created_at).toISOString(),
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
            }),
        )
        .output(ConversationSchema)
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session?.user?.email || ctx.session?.user?.name || 'unknown';

            logger.info({ component: 'messages', userId, name: input.name }, 'Creating conversation');

            try {
                // Create the conversation
                const [conversation] = await db('conversations').insert({ name: input.name }).returning('*');

                // Add the creator as a participant (Supabase)
                const participantIds = new Set([userId, ...input.participantIds]);
                const accessToken = ctx.session?.accessToken;
                logger.debug(
                    {
                        component: 'messages',
                        userId,
                        hasAccessToken: !!accessToken,
                    },
                    'Preparing Supabase client for participant insert (server will use service-role key)',
                );
                // Use service-role client for server-side inserts
                const supabase = createServerSupabase();
                try {
                    const { error: participantInsertError } = await supabase
                        .from(TABLES.conversationParticipants)
                        .insert(
                            Array.from(participantIds).map((participantId) => ({
                                conversation_id: conversation.id,
                                user_id: participantId,
                            })),
                        );
                    if (participantInsertError) {
                        throw new Error(participantInsertError.message);
                    }
                } catch (innerErr: unknown) {
                    let innerMsg: string | undefined;
                    if (
                        innerErr &&
                        typeof innerErr === 'object' &&
                        'message' in innerErr &&
                        typeof (innerErr as Record<string, unknown>)['message'] === 'string'
                    ) {
                        innerMsg = String((innerErr as Record<string, unknown>)['message']);
                    }
                    logger.error(
                        { component: 'messages', userId, errMessage: innerMsg },
                        'participant insert failed (thrown)',
                    );
                    throw innerErr;
                }

                return {
                    ...conversation,
                    created_at: conversation.created_at.toISOString(),
                    updated_at: conversation.updated_at.toISOString(),
                    last_message: null,
                    last_message_at: null,
                };
            } catch (err: unknown) {
                let errMessage: string | undefined;
                if (
                    err &&
                    typeof err === 'object' &&
                    'message' in err &&
                    typeof (err as Record<string, unknown>)['message'] === 'string'
                ) {
                    errMessage = String((err as Record<string, unknown>)['message']);
                }
                logger.error(
                    { component: 'messages', userId, name: input.name, errMessage },
                    'createConversation failed',
                );
                throw err;
            }
        });
};
