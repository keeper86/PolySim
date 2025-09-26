import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });

    // Define paths that are always accessible (e.g., login, health check, API auth, public assets)
    const publicPaths = ['/api/auth', '/api/health', '/_next', '/favicon.ico', '/api/trpc'];
    const publicExactPaths = ['/', '/imprint'];

    const isPublicPath =
        publicExactPaths.includes(request.nextUrl.pathname) ||
        publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    if (!token) {
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
