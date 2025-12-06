import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import crypto from 'crypto';
import type { NoAuthSession, Session } from 'next-auth';
import { getServerSession, type PATSession } from 'next-auth';
import { db } from './db';
import { recordPatUsage } from './patRateLimiter';

async function validateBearerToken(token: string): Promise<PATSession | null> {
    if (!token) {
        return null;
    }

    const createHmac = crypto.createHmac('sha256', process.env.SUPER_SECRET_SERVER_PASSWORD || 'default_salt');
    const tokenWithSalt = createHmac.update(token).digest('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenWithSalt).digest('hex');
    const row = await db('personal_access_tokens')
        .where({ token_hash: tokenHash })
        .andWhere(function () {
            this.whereNull('expires_at').orWhere('expires_at', '>', new Date().toISOString());
        })
        .first();

    if (row) {
        return {
            type: 'pat-auth',
            patToken: token,
            patId: row.id,
            user: { id: row.user_id },
            expires: new Date(row.expires_at ?? 0).toISOString(),
        };
    }

    return null;
}

export async function createContext(opts?: {
    req?: Request;
}): Promise<{ session: Session | PATSession | NoAuthSession }> {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession) {
        return { session: nextAuthSession };
    }

    let session: PATSession | NoAuthSession = {
        type: 'no-auth',
        user: null,
    };

    if (opts?.req) {
        const auth = opts.req.headers.get('authorization');
        if (auth && auth.startsWith('Bearer ')) {
            const token = auth.slice(7);
            session = (await validateBearerToken(token)) || session;

            const userAgent = opts.req.headers.get('user-agent') ?? null;
            const xff = opts.req.headers.get('x-forwarded-for');
            const ip = xff
                ? xff.split(',')[0].trim()
                : (opts.req.headers.get('x-real-ip') ?? opts.req.headers.get('cf-connecting-ip') ?? null);
            recordPatUsage({ session, userAgent, ip, throwOnExceed: true });
        }
    }

    return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
