'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTRPC } from '@/lib/trpc';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    userId?: string;
    large?: boolean;
    src?: string | null;
};

export default function UserAvatar({ userId, large = false, src = null }: Props) {
    const trpc = useTRPC();

    const queryOptions = trpc.getUser.queryOptions({ userId });
    const { data, isLoading, isError, error } = useQuery({ ...queryOptions, enabled: !src });

    const finalDisplayName = data?.displayName ?? 'JD';

    const initials = React.useMemo(() => {
        if (!finalDisplayName) {
            return '';
        }
        return finalDisplayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [finalDisplayName]);

    const avatarSrc = src ?? (data?.avatar ? `data:image/png;base64,${data.avatar}` : null);

    if (!src && isLoading) {
        return (
            <Avatar className={large ? 'w-32 h-32' : undefined}>
                <span className='flex items-center justify-center w-7/8 h-7/8 p-1'>
                    <Spinner className='h-8 w-8' />
                </span>
            </Avatar>
        );
    }

    if (!src && isError) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Avatar className={large ? 'w-32 h-32' : undefined}>
                        <AvatarFallback className='rounded-lg p-1 bg-muted  text-red-500'>?</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>{error?.message}</TooltipContent>
            </Tooltip>
        );
    }

    if (!avatarSrc) {
        return (
            <Avatar className={large ? 'w-32 h-32' : undefined}>
                <AvatarFallback className='rounded-lg p-1 bg-muted'>{initials}</AvatarFallback>
            </Avatar>
        );
    }

    return (
        <Avatar className={large ? 'w-32 h-32' : undefined}>
            <AvatarImage src={avatarSrc} alt={'User Avatar'} className='rounded-lg' />
        </Avatar>
    );
}
