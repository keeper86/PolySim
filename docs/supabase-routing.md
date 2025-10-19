# Supabase routing and migration

This project now routes realtime traffic directly to the Supabase realtime container and uses PostgREST for REST in development.

Summary

- Production (docker-compose.yaml): only `realtime` service is provided for Supabase features. Caddy routes `realtime.${APP_DOMAIN}` -> `realtime:4000`.
- Development (docker-compose.development.yaml): includes `postgrest` and `realtime`. Caddy routes:
    - `supabase.${APP_DOMAIN}` -> `postgrest:8000` (REST API)
    - `realtime.${APP_DOMAIN}` -> `realtime:4000` (WebSocket realtime)

Migration steps for clients

1. Update client-side code to connect directly to Supabase realtime:

```js
const supabase = createClient('wss://realtime.YOUR_DOMAIN', {
    // supply anon key or use Authorization header with Bearer <access_token>
});

// create a private channel
const channel = supabase.channel('public:messages', { config: { private: true } });
```

2. For REST calls in dev, point to `https://supabase.YOUR_DOMAIN` (PostgREST).

3. Remove reliance on Next.js proxy endpoints (`/api/realtime` and `/api/realtime/sse`). They return 410 as of the migration.

Testing

- Start services:

```bash
# dev
docker compose -f docker-compose.development.yaml up -d
# prod
docker compose up -d caddy
```

- Test realtime (example):

```bash
wscat -c "ws://realtime.${APP_DOMAIN}:4000"
```

Notes

- Keep `service_role` secrets server-only. Clients should use anon key and RLS.
- Ensure RLS policies reference `auth.uid()` (migration creates helper function in DB). If you change JWT secrets, update `JWT_SECRET`/`NEXTAUTH_SECRET` accordingly.
