import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getPublicRoutes } from './lib/appRoutes';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const publicPaths = ['/api/', '/_next', '/favicon.ico', '/benchmarks'];

    const isPublicPath =
        getPublicRoutes().includes(request.nextUrl.pathname) ||
        publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const isApiRequest = request.nextUrl.pathname.startsWith('/api/public');
        if (isApiRequest) {
            return NextResponse.next();
        }
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
