import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
}));

const mockQueryOptions = vi.fn();
vi.mock('@/lib/trpc', () => ({
    useTRPC: () => ({
        getUser: {
            queryOptions: mockQueryOptions,
        },
    }),
}));

/* eslint-disable @next/next/no-img-element */
vi.mock('@/components/ui/avatar', () => ({
    Avatar: ({ children }: { children?: React.ReactNode }) => <div data-testid='avatar'>{children}</div>,
    AvatarImage: ({ src, alt, className }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <img data-testid='avatar-image' src={src} alt={alt} className={className} />
    ),
    AvatarFallback: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
        <div data-testid='avatar-fallback' className={className}>
            {children}
        </div>
    ),
}));

vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <div data-testid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid='tooltip-trigger'>{children}</div>
    ),
    TooltipContent: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid='tooltip-content'>{children}</div>
    ),
}));

import UserAvatar from './UserAvatar';
import { useQuery } from '@tanstack/react-query';

describe('UserAvatar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders avatar image when avatar base64 is provided', () => {
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: { displayName: 'John Doe', avatar: 'R0lGODlhAQABAIAAAAUEBA==' },
            isLoading: false,
            isError: false,
            error: null,
        });

        render(<UserAvatar userId={'user-1'} />);

        const { container } = render(<UserAvatar userId={'user-1'} />);
        const avatarImage = container.querySelector('[data-testid="avatar-image"]') as HTMLImageElement | null;
        expect(avatarImage).toBeTruthy();
        expect(avatarImage?.getAttribute('src')).toContain('data:image/png;base64,R0lGODlhAQABAIAAAAUEBA==');
    });

    it('renders fallback initials when no avatar provided', () => {
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: { displayName: 'Jane Doe', avatar: undefined },
            isLoading: false,
            isError: false,
            error: null,
        });

        render(<UserAvatar userId={'user-2'} />);

        const fallback = screen.getByText('JD');
        expect(fallback).toBeInTheDocument();
    });

    it('renders empty fallback when no displayName is available', () => {
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: { displayName: undefined, avatar: undefined },
            isLoading: false,
            isError: false,
            error: null,
        });

        render(<UserAvatar />);

        const { container } = render(<UserAvatar />);
        const fallback = container.querySelector('[data-testid="avatar-fallback"]');
        expect(fallback).toBeInTheDocument();
    });

    it('calls trpc.getUser.queryOptions with provided userId and with undefined when not provided', () => {
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: { displayName: 'A B', avatar: undefined },
            isLoading: false,
            isError: false,
            error: null,
        });

        render(<UserAvatar userId={'abc-123'} />);
        expect(mockQueryOptions).toHaveBeenCalledWith({ userId: 'abc-123' });

        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: { displayName: 'C D', avatar: undefined },
            isLoading: false,
            isError: false,
            error: null,
        });

        render(<UserAvatar />);
        expect(mockQueryOptions).toHaveBeenCalledWith({ userId: undefined });
    });

    it('renders spinner when query is loading', () => {
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
        });

        const { container } = render(<UserAvatar userId={'loading-user'} />);
        const spinner = container.querySelector('[role="status"][aria-label="Loading"]');
        expect(spinner).toBeTruthy();
    });

    it('renders error fallback and shows tooltip with error message when query errors', async () => {
        const errMsg = 'Network failed';
        // @ts-expect-error mocked data
        vi.mocked(useQuery).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: { message: errMsg },
        });

        render(<UserAvatar userId={'err-user'} />);

        const fallback = screen.getByTestId('avatar-fallback');
        expect(fallback).toBeInTheDocument();
        expect(fallback).toHaveTextContent('?');

        const avatar = screen.getByTestId('avatar');
        await userEvent.hover(avatar);

        const contents = await screen.findAllByText(errMsg);
        expect(contents.length).toBeGreaterThan(0);
    });
});
