import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER!,
        }),
    ],
    // Optional: Add Keycloak tokens to the session for use in tRPC
    callbacks: {
        // @ts-expect-error todo
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            return token;
        },
        // @ts-expect-error todo
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            return session;
        },
    },
};
