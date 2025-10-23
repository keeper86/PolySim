import AppProviders from '@/app/AppProviders';
import { getMainNavRoutes, getProtectedRoutes, getPublicRoutes } from '@/lib/appRoutes';
import { render, screen } from '@testing-library/react';
import type { Session } from 'next-auth';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NavMain } from './navMain';

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('NavMain', () => {
    it('renders all main navigation routes from PAGE_ROUTES and their icons', () => {
        const mockSession: Session = {
            user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
            expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        };

        render(
            <AppProviders session={mockSession}>
                <NavMain />
            </AppProviders>,
        );
        const mainNavRoutes = getMainNavRoutes();
        let iconCount = 0;
        for (const route of mainNavRoutes) {
            expect(screen.getByText(route.label)).toBeInTheDocument();
            const link = screen.getByText(route.label).closest('a');
            expect(link).toHaveAttribute('href', route.path);
            if (route.icon) {
                const svg = link?.querySelector('svg');
                expect(svg).toBeTruthy();
                iconCount++;
            }
        }
        expect(iconCount).toBeGreaterThan(0);
    });

    it('shows only public routes when not logged in', () => {
        render(
            <AppProviders session={null}>
                <NavMain />
            </AppProviders>,
        );

        const publicRoutes = getPublicRoutes();
        const mainRoutes = getMainNavRoutes();

        for (const path of publicRoutes) {
            const routeMeta = mainRoutes.find((r) => r.path === path) || null;
            if (routeMeta) {
                expect(screen.getByText(routeMeta.label)).toBeInTheDocument();
            }
        }

        const protectedRoutes = getProtectedRoutes();
        for (const route of protectedRoutes) {
            if (!route.isPublic) {
                const maybe = screen.queryByText(route.label);
                if (maybe) {
                    expect(maybe).not.toBeInTheDocument();
                }
            }
        }
    });
});
