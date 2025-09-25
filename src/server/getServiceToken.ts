let cachedToken: string | null = null;
let cachedExpiry = 0;

const KEYCLOAK_DOMAIN = process.env.KEYCLOAK_DOMAIN;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

if (!KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET || !KEYCLOAK_DOMAIN || !KEYCLOAK_REALM) {
    throw new Error('KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_DOMAIN or KEYCLOAK_REALM is not set');
}

export async function getServiceAccountToken() {
    if (cachedToken && Date.now() < cachedExpiry) {
        return cachedToken;
    }

    const res = await fetch(`https://${KEYCLOAK_DOMAIN}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        }),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(
            `Failed to fetch Keycloak token. Status: ${res.status} ${res.statusText}. Response: ${errorBody}`,
        );
    }
    const data = await res.json();
    cachedToken = data.access_token;
    cachedExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}
