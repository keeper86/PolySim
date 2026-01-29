import {
    type LucideIcon,
    BadgeCheck,
    BookOpen,
    Brain,
    FileText,
    Gamepad,
    Home,
    KeyRound,
    Map,
    User,
    Search,
} from 'lucide-react';

import type { Route } from 'nextjs-routes';

export type RouteMetadata = {
    path: Exclude<Route['pathname'], `/api/${string}`>; // Exclude API routes
    label: string;
    icon?: LucideIcon;
    isPublic?: boolean;
    description?: string;
    isMainNav?: boolean;
    isSecondaryNav?: boolean;
};

export const isRoute = (entry: unknown): entry is RouteMetadata => {
    return typeof entry === 'object' && entry !== null && 'path' in entry && 'label' in entry && !('root' in entry);
};

export const isRouteManifest = (entry: unknown): entry is RouteManifest => {
    return typeof entry === 'object' && entry !== null && 'root' in entry && isRoute(entry.root);
};

export interface RouteManifest {
    root: RouteMetadata;
    [key: string]: RouteMetadata | RouteManifest;
}

export type RouteManifestEntry = RouteMetadata | RouteManifest;

export const APP_ROUTES = {
    root: {
        path: '/',
        label: 'PolySim',
        icon: Home,
        isPublic: true,
        description: 'Dashboard and overview',
    },
    files: {
        root: {
            path: '/files',
            label: 'Files',
            icon: Map,
            description: 'File management and uploads',
            isMainNav: true,
        },
        visNetworkDemo: {
            path: '/files/vis-network-demo',
            label: 'vis-network Demo',
            description: 'Demonstration of vis-network (network.js) integration',
            isMainNav: true,
        },
    },
    apiDoc: {
        path: '/api-doc',
        label: 'API Docs',
        icon: BookOpen,
        description: 'Interactive API documentation',
        isSecondaryNav: true,
    },
    pong: {
        path: '/pong',
        label: 'Paddle War',
        icon: Gamepad,
        isPublic: true,
        description: 'Classic pong game',
    },
    skills: {
        root: {
            path: '/skills',
            label: 'Skillradar',
            icon: Brain,
            description: 'Manage and assess your skills',
            isSecondaryNav: true,
        },
    },
    query: {
        path: '/query',
        label: 'Query Page',
        icon: Search,
        isPublic: true,
        description: 'Find your Program',
        isMainNav: true,
    },
    account: {
        root: {
            path: '/account',
            label: 'Account',
            icon: User,
            description: 'User account settings',
        },
        skillsAssessment: {
            path: '/account/skills-assessment',
            label: 'Skills Assessment',
            icon: BadgeCheck,
            description: 'Assess and track your technical skills',
        },
        pat: {
            path: '/account/pat',
            label: 'PAT management',
            icon: KeyRound,
            description: 'Manage Personal Access Tokens',
        },
    },
    imprint: {
        path: '/imprint',
        label: 'Imprint',
        icon: FileText,
        isPublic: true,
        isSecondaryNav: true,
        description: 'Legal information and imprint',
    },
} as const satisfies RouteManifest;

const filterRoutes = (route: RouteManifestEntry, condition: (route: RouteMetadata) => boolean) => {
    const filteredRoutes: RouteMetadata[] = [];
    if (isRoute(route)) {
        if (condition(route)) {
            filteredRoutes.push(route);
        }
    } else {
        Object.values(route).forEach((child) => filteredRoutes.push(...filterRoutes(child, condition)));
    }
    return filteredRoutes;
};

let mainNavRoutes: RouteMetadata[] = [];
export function getMainNavRoutes(): RouteMetadata[] {
    if (mainNavRoutes.length > 0) {
        return mainNavRoutes;
    }
    mainNavRoutes = filterRoutes(APP_ROUTES, (route) => route.isMainNav === true);
    return mainNavRoutes;
}

let publicRoutes: string[] = [];
export const getPublicRoutes = () => {
    if (publicRoutes.length > 0) {
        return publicRoutes;
    }
    publicRoutes = filterRoutes(APP_ROUTES, (route) => route.isPublic === true).map((route) => route.path);
    return publicRoutes;
};

let protectedRoutes: RouteMetadata[] = [];
export function getProtectedRoutes(): RouteMetadata[] {
    if (protectedRoutes.length > 0) {
        return protectedRoutes;
    }
    protectedRoutes = filterRoutes(APP_ROUTES, (route) => route.isPublic !== true);
    return protectedRoutes;
}

let secondaryNavRoutes: RouteMetadata[] = [];
export function getSecondaryNavRoutes(): RouteMetadata[] {
    if (secondaryNavRoutes.length > 0) {
        return secondaryNavRoutes;
    }
    secondaryNavRoutes = filterRoutes(APP_ROUTES, (route) => route.isSecondaryNav === true);
    return secondaryNavRoutes;
}

export function getBreadcrumbData(pathname: string): Array<{ path: string; label: string; isLast: boolean }> {
    const pathLabelMap: Record<string, string> = {};
    function flatten(obj: unknown) {
        if (obj && typeof obj === 'object') {
            const o = obj as Record<string, unknown>;
            if ('path' in o && 'label' in o && typeof o.path === 'string' && typeof o.label === 'string') {
                pathLabelMap[o.path] = o.label;
            }
            for (const key in o) {
                if (typeof o[key] === 'object' && o[key] !== null) {
                    flatten(o[key]);
                }
            }
        }
    }
    flatten(APP_ROUTES);

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ path: string; label: string; isLast: boolean }> = [
        { path: '/', label: 'Home', isLast: segments.length === 0 },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label = pathLabelMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({ path: currentPath, label, isLast });
    });
    return breadcrumbs;
}
