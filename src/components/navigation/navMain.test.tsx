import { getMainNavRoutes } from '@/app/appRoutes';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NavMain } from './navMain';

// Mock next/link for testing
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('NavMain', () => {
    it('renders all main navigation routes from PAGE_ROUTES and their icons', () => {
        render(<NavMain />);
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
});
