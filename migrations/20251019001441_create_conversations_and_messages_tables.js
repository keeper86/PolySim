/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Creating conversations and messages tables.');
    }
    // Create conversations table
    await knex.schema.createTable('conversations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });

    // Create conversation_participants table (many-to-many relationship)
    await knex.schema.createTable('conversation_participants', (table) => {
        table.increments('id').primary();
        table
            .integer('conversation_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('conversations')
            .onDelete('CASCADE');
        table.string('user_id').notNullable();
        table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
        table.unique(['conversation_id', 'user_id']);
        table.index('user_id');
    });

    // Create messages table
    await knex.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table
            .integer('conversation_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('conversations')
            .onDelete('CASCADE');
        table.string('sender_id').notNullable();
        table.text('content').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.index('conversation_id');
        table.index('created_at');
    });

    // Add realtime publication, RLS and policies (consolidated & idempotent)
    if (process.env.NODE_ENV === 'development') {
        console.log('Adding realtime triggers and RLS policies for messaging tables.');
    }

    // Ensure extension and publication exist
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await knex.raw(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
                    EXECUTE 'CREATE PUBLICATION supabase_realtime';
                END IF;
            END
            $$;
        `);

    // Add tables to publication only if not already included (safe check)
    await knex.raw(`DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE schemaname = 'public' AND tablename = 'messages' AND pubname = 'supabase_realtime') THEN
                ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE schemaname = 'public' AND tablename = 'conversations' AND pubname = 'supabase_realtime') THEN
                ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
            END IF;
        END$$;
        `);

    // Enable RLS on relevant tables
    await knex.raw('ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY');
    await knex.raw('ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY');
    await knex.raw('ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY');

    // Ensure auth schema and auth.uid() helper exist (Supabase uses auth.uid() in policies)
    await knex.raw('CREATE SCHEMA IF NOT EXISTS auth;');

    await knex.raw(`
            CREATE OR REPLACE FUNCTION auth.uid() RETURNS text AS $$
            BEGIN
                RETURN current_setting('jwt.claims.sub', true);
            END;
            $$ LANGUAGE plpgsql STABLE;
        `);

    // Policies for conversation_participants
    await knex.raw(`DROP POLICY IF EXISTS participants_select ON public.conversation_participants;`);
    await knex.raw(`CREATE POLICY participants_select ON public.conversation_participants
            FOR SELECT USING (user_id = auth.uid());`);

    await knex.raw(`DROP POLICY IF EXISTS participants_insert ON public.conversation_participants;`);
    await knex.raw(`CREATE POLICY participants_insert ON public.conversation_participants
            FOR INSERT WITH CHECK (user_id = auth.uid());`);

    await knex.raw(`DROP POLICY IF EXISTS participants_update ON public.conversation_participants;`);
    await knex.raw(`CREATE POLICY participants_update ON public.conversation_participants
            FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`);

    await knex.raw(`DROP POLICY IF EXISTS participants_delete ON public.conversation_participants;`);
    await knex.raw(`CREATE POLICY participants_delete ON public.conversation_participants
            FOR DELETE USING (user_id = auth.uid());`);

    // Policies for conversations
    await knex.raw(`DROP POLICY IF EXISTS conversations_select ON public.conversations;`);
    await knex.raw(`CREATE POLICY conversations_select ON public.conversations
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = public.conversations.id AND cp.user_id = auth.uid()
                )
            );`);

    await knex.raw(`DROP POLICY IF EXISTS conversations_update ON public.conversations;`);
    await knex.raw(`CREATE POLICY conversations_update ON public.conversations
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = public.conversations.id AND cp.user_id = auth.uid()
                )
            ) WITH CHECK (true);`);

    await knex.raw(`DROP POLICY IF EXISTS conversations_insert ON public.conversations;`);
    await knex.raw(`CREATE POLICY conversations_insert ON public.conversations
            FOR INSERT WITH CHECK (true);`);

    // Policies for messages
    await knex.raw(`DROP POLICY IF EXISTS messages_select ON public.messages;`);
    await knex.raw(`CREATE POLICY messages_select ON public.messages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = public.messages.conversation_id AND cp.user_id = auth.uid()
                )
            );`);

    await knex.raw(`DROP POLICY IF EXISTS messages_insert ON public.messages;`);
    await knex.raw(`CREATE POLICY messages_insert ON public.messages
            FOR INSERT WITH CHECK (
                sender_id = auth.uid() AND EXISTS (
                    SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = public.messages.conversation_id AND cp.user_id = auth.uid()
                )
            );`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Dropping conversations and messages tables.');
    }
    await knex.schema.dropTableIfExists('messages');
    await knex.schema.dropTableIfExists('conversation_participants');
    await knex.schema.dropTableIfExists('conversations');
};
