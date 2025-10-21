import KeycloakProvider from 'next-auth/providers/keycloak';
import { db } from '../../../../server/db';
import { logger } from '../../../../server/logger';
import type { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER!,
        }),
    ],
    callbacks: {
        async jwt(thing) {
            const { token, account, profile } = thing;
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
                token.userId = account.providerAccountId || profile?.sub;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;

            try {
                const userId = token.userId as string | undefined;
                if (userId) {
                    const row = await db('user_data').where({ user_id: userId }).first();
                    if (row) {
                        session.user = {
                            id: row.user_id,
                            email: row.email,
                            displayName: row.display_name,
                            hasAssessmentPublished: row.has_assessment_published,
                        };
                    } else {
                        const displayName = session.user?.displayName ?? 'No name set';
                        const email = session.user?.email;
                        if (!email) {
                            throw new Error('Email is required for user_data insertion');
                        }
                        logger.debug(
                            { component: 'auth-session' },
                            `No user_data found for ${userId}, inserting new row`,
                        );

                        await db('user_data').insert({
                            user_id: userId,
                            display_name: displayName,
                            email,
                        });
                        session.user = {
                            id: userId,
                            email,
                            displayName,
                            hasAssessmentPublished: false,
                        };
                        logger.debug({ component: 'auth-session' }, `Inserted and attached user_data for ${userId}`);
                    }
                } else {
                    logger.debug({ component: 'auth-session' }, 'No userId present on token; skipping user_data load');
                }
            } catch (err) {
                logger.error(
                    { component: 'auth-session', err },
                    'Failed to load or insert user_data on session callback',
                );
            }

            return session;
        },
    },
};
