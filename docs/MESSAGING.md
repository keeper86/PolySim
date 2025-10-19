# Group Messaging Feature

## Overview

PolySim now includes a self-hosted real-time group messaging feature that allows registered users to communicate within the application without relying on external hosted services.

## Features

- **Conversation Management**: Create and manage multiple group conversations
- **Real-time Messaging**: Messages appear instantly for all participants (2-second polling)
- **Message Persistence**: All messages are stored in PostgreSQL and persist across sessions
- **Multi-user Support**: Multiple users can participate in the same conversation
- **User-friendly Interface**: Clean, responsive UI with conversation list and message thread views

## Architecture

### Database Schema

The messaging feature uses three PostgreSQL tables:

1. **conversations**: Stores conversation metadata
    - `id`: Primary key
    - `name`: Conversation name
    - `created_at`: Creation timestamp
    - `updated_at`: Last update timestamp

2. **conversation_participants**: Many-to-many relationship between users and conversations
    - `id`: Primary key
    - `conversation_id`: Foreign key to conversations
    - `user_id`: User identifier (email or username)
    - `joined_at`: When the user joined

3. **messages**: Stores all messages
    - `id`: Primary key
    - `conversation_id`: Foreign key to conversations
    - `sender_id`: User who sent the message
    - `content`: Message text content
    - `created_at`: Message timestamp

### API Endpoints (tRPC)

All endpoints are protected and require authentication:

1. **conversations-get**: List all conversations for the current user
    - Returns conversations with last message preview
    - Ordered by most recent activity

2. **messages-get**: Retrieve messages for a specific conversation
    - Input: `conversationId`, optional `limit` and `offset`
    - Returns messages ordered chronologically

3. **messages-send**: Send a message to a conversation
    - Input: `conversationId`, `content`
    - Verifies user is a participant
    - Returns the created message

4. **conversations-create**: Create a new conversation
    - Input: `name`, `participantIds` (array of user IDs)
    - Automatically adds the creator as a participant
    - Returns the created conversation

### Real-time Updates

The messaging interface uses **Supabase Realtime** with WebSockets for true real-time updates:

- WebSocket connection established on component mount
- Subscriptions to PostgreSQL changes via Supabase Realtime
- Automatic message delivery when new messages are inserted
- Database triggers publish NOTIFY events on message inserts
- Connection cleanup when component unmounts or conversation changes

This provides a self-hosted solution using Supabase Realtime Docker container connected to PostgreSQL logical replication.

## Usage

### Accessing the Messaging Feature

1. Navigate to the **Messages** link in the main navigation sidebar
2. Must be logged in to access the feature

### Creating a Conversation

1. Click the **+** button in the conversations sidebar
2. Enter a conversation name
3. Add participant IDs (comma-separated email addresses or usernames)
4. Click **Create**

### Sending Messages

1. Select a conversation from the sidebar
2. Type your message in the input field at the bottom
3. Press Enter or click the Send button
4. Messages appear instantly for all participants

### UI Components

- **Conversations List**: Left sidebar showing all conversations with last message preview
- **Message Thread**: Main area displaying messages in chronological order
- **Message Input**: Bottom bar for composing new messages
- **Empty States**: Helpful prompts when no conversations or messages exist

## Architecture

The messaging feature uses a simplified, self-hosted architecture:

1. **PostgreSQL** (postgres:15-alpine)
    - With `wal_level=logical` for replication
    - Hosts all messaging tables
    - Direct database access via Knex.js from Next.js

2. **Supabase Realtime** (supabase/realtime:v2.30.23)
    - Listens to PostgreSQL logical replication (STREAM mode)
    - Provides WebSocket endpoint on port 4000
    - Broadcasts database INSERT events to connected clients

3. **Next.js App**
    - tRPC API endpoints for CRUD operations (via direct database access)
    - Frontend connects to Realtime via Supabase JS client for WebSocket subscriptions
    - Displays messages in real-time

**Note**: PostgREST is NOT used. All database operations go through tRPC endpoints with Knex.js. Realtime is ONLY used for WebSocket subscriptions to database changes.

Configuration in `docker-compose.development.yaml` and `docker-compose.yaml`.

### Client Components

- **MessagingInterface** (`src/components/client/MessagingInterface.tsx`): Main messaging UI component
    - Uses React hooks for state management
    - Integrates Supabase Realtime WebSocket client
    - Subscribes to PostgreSQL changes via realtime channels
    - Auto-scrolls to latest messages
    - Displays sender information and timestamps

### Server Components

- **Message Endpoints** (`src/server/endpoints/messages.ts`): tRPC API handlers
    - Input validation with Zod schemas
    - Authorization checks using NextAuth session (verify participants)
    - Direct database queries using Knex.js (no PostgREST)
    - Proper error handling

### Database Migrations

- Migration: `20251019001441_create_conversations_and_messages_tables.js`
    - Creates all tables with proper indexes and foreign key constraints
    - Cascade deletes for data integrity
- Migration: `20251019003407_add_realtime_triggers_for_messages.js`
    - Adds PostgreSQL NOTIFY triggers for message inserts
    - Enables logical replication for Supabase Realtime
    - Creates notification functions for real-time events

## Security Considerations

- All endpoints require authentication
- Users can only access conversations they are participants in
- Foreign key constraints ensure data integrity
- Input validation prevents SQL injection
- User IDs are verified against the session

## Future Enhancements

Potential improvements for the messaging feature:

1. **Read Receipts**: Track which messages have been read by participants
2. **Typing Indicators**: Show when other users are typing
3. **File Attachments**: Support sending images and files
4. **Message Editing/Deletion**: Allow users to edit or delete their messages
5. **Search**: Full-text search across messages
6. **Notifications**: Browser notifications for new messages
7. **Message Reactions**: Emoji reactions to messages
8. **User Presence**: Show online/offline status
9. **Direct Messages**: Support for 1-on-1 conversations
10. **Message Threading**: Reply to specific messages

## Testing

The messaging feature includes:

- Database schema validation through migrations
- Manual testing with test data insertion
- API endpoint testing through tRPC client

To test manually:

```sql
-- Insert test conversation
INSERT INTO conversations (name) VALUES ('Test Group');

-- Add participants
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
(1, 'user1@example.com'),
(1, 'user2@example.com');

-- Add test messages
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(1, 'user1@example.com', 'Hello!'),
(1, 'user2@example.com', 'Hi there!');
```

## Performance

- Indexed queries for fast message retrieval
- Pagination support (limit/offset) for large conversations
- Efficient polling with minimal database overhead
- Conversation list shows only last message for quick loading

## Dependencies

Key dependencies used:

- `@radix-ui/react-scroll-area`: Accessible scrolling component for message lists
- `@supabase/supabase-js`: WebSocket client for Supabase Realtime subscriptions (realtime only, not PostgREST)

## Environment Variables

Required environment variables:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=polysimdb

# Realtime WebSocket URL (connects to Supabase Realtime server)
NEXT_PUBLIC_REALTIME_URL=http://localhost:4000

# Authentication
NEXTAUTH_SECRET=super-secret
```

## Troubleshooting

### Realtime Container Fails to Start

If you see `RLIMIT_NOFILE: unbound variable` error:

- **Solution**: The `RLIMIT_NOFILE` environment variable is now set in docker-compose files (default: 10000)
- Ensure you're using the latest docker-compose configuration

### Startup Order Issues

The services must start in this order:

1. **PostgreSQL** (with `wal_level=logical`)
2. **Migrations** (creates tables and triggers)
3. **Realtime** (connects to PostgreSQL)
4. **Next.js App** (connects to both)

In production (docker-compose.yaml), this is handled automatically with `depends_on` conditions.

In development:

1. Start docker services: `docker compose -f docker-compose.development.yaml up`
2. Wait for database to be ready
3. Run app locally: `npm run dev` (migrations run automatically)

### WebSocket Connection Fails

If messages don't appear in real-time:

1. Check Realtime container is running: `docker ps | grep realtime`
2. Verify `NEXT_PUBLIC_REALTIME_URL` is set correctly
3. Check browser console for WebSocket errors
4. Ensure port 4000 is accessible

### Database Triggers Not Working

If messages are saved but not broadcast:

1. Verify triggers exist: `\df notify_message_insert` in psql
2. Check migration was applied: `SELECT * FROM knex_migrations`
3. Restart Realtime container to reconnect to PostgreSQL

### Performance Issues

If message delivery is slow:

- Check `REPLICATION_POLL_INTERVAL` (default: 100ms)
- Verify database indexes are created
- Monitor PostgreSQL replication slot usage
