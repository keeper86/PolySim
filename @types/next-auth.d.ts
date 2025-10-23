import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        user?: {
            id: string;
            name?: string | null;
            displayName?: string | null;
            hasAssessmentPublished?: boolean;
            email?: string | null;
        } | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        idToken?: string;
        userId?: string;
    }
}
