import type { NoAuthSession, PATSession } from 'next-auth';
import { db } from './db';
import { logger } from './logger';
import { TRPCError } from '@trpc/server';

/**
 * Simple in-memory PAT rate limiter for development/testing.
 * Not shared across instances; intended as a short-lived, replaceable helper.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_UPLOADS_PER_WINDOW = 5;

const patMap = new Map<string, number[]>();

// logs usage of a PAT without blocking
// can throw if rate limit exceeded
export const recordPatUsage = ({
    throwOnExceed,
    session,
    ip,
    userAgent,
}: {
    throwOnExceed?: boolean;
    session: PATSession | NoAuthSession;
    ip: string | null;
    userAgent: string | null;
}): void => {
    if (session.type !== 'pat-auth') {
        return;
    }

    const now = new Date();
    const insertObj = { pat_id: session.patId, used_at: now, ip, user_agent: userAgent };

    db('personal_access_tokens_logs')
        .insert(insertObj)
        .catch(() => {
            logger.debug({ patId: session.patId }, 'Failed to log PAT usage');
        });

    const arr = patMap.get(session.patId) || [];
    arr.push(now.getTime());
    const pruned = arr.filter((t) => t > now.getTime() - WINDOW_MS);
    patMap.set(session.patId, pruned);
    if (pruned.length >= MAX_UPLOADS_PER_WINDOW && throwOnExceed) {
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests from this PAT, please try again later',
        });
    }
};
