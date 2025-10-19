import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getPublicRoutes } from './lib/pageRoutes';
import { logger } from './server/logger';

export async function middleware(request: NextRequest) {
    // Safe diagnostics: log which auth headers are present and a non-sensitive "shape" of the token
    try {
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');
        logger.debug(
            {
                path: request.nextUrl.pathname,
                method: request.method,
                hasAuthorization: !!authHeader,
                hasCookie: !!cookieHeader,
            },
            'auth headers present',
        );

        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            logger.debug({ tokenPresent: false }, 'No next-auth token found in request');
        } else {
            // Build a non-sensitive shape (do NOT log actual token strings)
            const keys = Object.keys(token as Record<string, unknown>);
            const tokenShape: Record<string, string> = {};
            for (const k of keys) {
                const v = token as unknown as Record<string, unknown>;
                const val = v[k];
                if (typeof val === 'string') {
                    tokenShape[k] = `string(len=${val.length})`;
                } else {
                    tokenShape[k] = typeof val;
                }
            }
            logger.debug({ tokenPresent: true, tokenShape }, 'next-auth token shape (non-sensitive)');
        }
    } catch (err: unknown) {
        // Log error name/message but never the token or raw header value
        let errName: string | undefined;
        let errMessage: string | undefined;
        if (err && typeof err === 'object') {
            if ('name' in err && typeof (err as Record<string, unknown>)['name'] === 'string') {
                errName = String((err as Record<string, unknown>)['name']);
            }
            if ('message' in err && typeof (err as Record<string, unknown>)['message'] === 'string') {
                errMessage = String((err as Record<string, unknown>)['message']);
            }
        }
        logger.error({ errName, errMessage }, 'Error reading token in middleware');
    }

    // Define paths that are always accessible (e.g., login, health check, API auth, public assets)
    const publicPaths = [
        '/api/auth',
        '/api/health',
        '/_next',
        '/favicon.ico',
        '/api/trpc',
        '/api-doc',
        '/api/openapi.json',
    ];

    const isPublicPath =
        getPublicRoutes().includes(request.nextUrl.pathname) ||
        publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    // The actual authentication gate remains the same — determine presence of a valid token before allowing access.
    // Re-run a light token check here to decide redirect (avoid reusing any potentially-sensitive local variables).
    try {
        const hasToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        if (!hasToken) {
            const signInUrl = new URL('/api/auth/signin', request.url);
            signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
            return NextResponse.redirect(signInUrl);
        }
    } catch (err: unknown) {
        // If token decoding fails (e.g., malformed token or secret issues) log and redirect to signin.
        let errName: string | undefined;
        let errMessage: string | undefined;
        if (err && typeof err === 'object') {
            if ('name' in err && typeof (err as Record<string, unknown>)['name'] === 'string') {
                errName = String((err as Record<string, unknown>)['name']);
            }
            if ('message' in err && typeof (err as Record<string, unknown>)['message'] === 'string') {
                errMessage = String((err as Record<string, unknown>)['message']);
            }
        }
        logger.error({ errName, errMessage }, 'Token decode failed in middleware; redirecting to signin');
        const signInUrl = new URL('/api/auth/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

// Configure the paths this middleware runs on
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
