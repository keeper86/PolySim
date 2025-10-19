/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Adding realtime triggers for messages table.');
    }

    // Enable the PostgreSQL extension for publishing notifications
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create a function to notify on message insert
    await knex.raw(`
        CREATE OR REPLACE FUNCTION notify_message_insert()
        RETURNS trigger AS $$
        DECLARE
            payload JSON;
        BEGIN
            payload = json_build_object(
                'table', TG_TABLE_NAME,
                'type', TG_OP,
                'id', NEW.id,
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id,
                'content', NEW.content,
                'created_at', NEW.created_at
            );
            
            PERFORM pg_notify('realtime:messages', payload::text);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Create trigger for message inserts
    await knex.raw(`
        CREATE TRIGGER message_insert_trigger
        AFTER INSERT ON messages
        FOR EACH ROW
        EXECUTE FUNCTION notify_message_insert();
    `);

    // Create a function to notify on conversation updates
    await knex.raw(`
        CREATE OR REPLACE FUNCTION notify_conversation_update()
        RETURNS trigger AS $$
        DECLARE
            payload JSON;
        BEGIN
            payload = json_build_object(
                'table', TG_TABLE_NAME,
                'type', TG_OP,
                'id', NEW.id,
                'name', NEW.name,
                'updated_at', NEW.updated_at
            );
            
            PERFORM pg_notify('realtime:conversations', payload::text);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Create trigger for conversation updates
    await knex.raw(`
        CREATE TRIGGER conversation_update_trigger
        AFTER UPDATE ON conversations
        FOR EACH ROW
        EXECUTE FUNCTION notify_conversation_update();
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Removing realtime triggers for messages table.');
    }

    await knex.raw('DROP TRIGGER IF EXISTS message_insert_trigger ON messages');
    await knex.raw('DROP FUNCTION IF EXISTS notify_message_insert()');
    await knex.raw('DROP TRIGGER IF EXISTS conversation_update_trigger ON conversations');
    await knex.raw('DROP FUNCTION IF EXISTS notify_conversation_update()');
};
