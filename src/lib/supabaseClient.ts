import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const createServerSupabase = (accessToken?: string): SupabaseClient => {
    const url = process.env.SUPABASE_URL!;
    // Always instantiate the server client with the SUPABASE_SERVICE_ROLE_KEY (server-side secret).
    // If a user's access token is provided, set it on the client so requests run with that session
    // rather than using the token as the API key (which can cause JWT parsing errors).
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    // If an access token is provided, attach it as a Bearer Authorization header for subsequent requests.
    // This avoids calling client.auth.setAuth which may not be available in all runtime builds.
    const client = accessToken
        ? createClient(url, serviceKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })
        : createClient(url, serviceKey);
    return client;
};

export type { SupabaseClient };
