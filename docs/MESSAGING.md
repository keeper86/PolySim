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

The messaging interface uses **polling** to achieve real-time updates:

- Messages are polled every 2 seconds when a conversation is selected
- Automatic scrolling to newest messages
- Silent polling to avoid UI disruption
- Polling stops when conversation is deselected

This approach provides a self-hosted solution without requiring WebSocket infrastructure.

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

## Technical Implementation

### Client Components

- **MessagingInterface** (`src/components/client/MessagingInterface.tsx`): Main messaging UI component
  - Uses React hooks for state management
  - Implements polling with setInterval
  - Auto-scrolls to latest messages
  - Displays sender information and timestamps

### Server Components

- **Message Endpoints** (`src/server/endpoints/messages.ts`): tRPC API handlers
  - Input validation with Zod schemas
  - Authorization checks (verify participants)
  - Database queries using Knex.js
  - Proper error handling

### Database Migrations

- Migration: `20251019001441_create_conversations_and_messages_tables.js`
- Creates all tables with proper indexes and foreign key constraints
- Cascade deletes for data integrity

## Security Considerations

- All endpoints require authentication
- Users can only access conversations they are participants in
- Foreign key constraints ensure data integrity
- Input validation prevents SQL injection
- User IDs are verified against the session

## Future Enhancements

Potential improvements for the messaging feature:

1. **WebSocket Support**: Replace polling with WebSockets for true real-time updates
2. **Read Receipts**: Track which messages have been read by participants
3. **Typing Indicators**: Show when other users are typing
4. **File Attachments**: Support sending images and files
5. **Message Editing/Deletion**: Allow users to edit or delete their messages
6. **Search**: Full-text search across messages
7. **Notifications**: Browser notifications for new messages
8. **Message Reactions**: Emoji reactions to messages
9. **User Presence**: Show online/offline status
10. **Direct Messages**: Support for 1-on-1 conversations

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

New dependencies added:

- `@radix-ui/react-scroll-area`: Accessible scrolling component for message lists
