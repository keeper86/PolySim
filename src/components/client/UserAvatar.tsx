'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTRPC } from '@/lib/trpc';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    userId?: string;
};

export default function UserAvatar({ userId }: Props) {
    const trpc = useTRPC();

    const { data, isLoading, isError, error } = useQuery(trpc.getUser.queryOptions({ userId }));

    const displayName = data?.displayName;
    const initials = React.useMemo(() => {
        if (!displayName) {
            return '';
        }
        return displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [displayName]);

    if (isLoading) {
        return (
            <Avatar>
                <span className='flex items-center justify-center w-7/8 h-7/8 p-1'>
                    <Spinner className='h-8 w-8' />
                </span>
            </Avatar>
        );
    }

    if (isError) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Avatar>
                        <AvatarFallback className='rounded-lg p-1 bg-muted  text-red-500'>?</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent>{error?.message}</TooltipContent>
            </Tooltip>
        );
    }

    const avatarBase64 = data?.avatar;
    if (!avatarBase64) {
        return (
            <Avatar>
                <AvatarFallback className='rounded-lg p-1 bg-muted'>{initials}</AvatarFallback>
            </Avatar>
        );
    }

    return (
        <Avatar>
            <AvatarImage src={`data:image/png;base64,${avatarBase64}`} alt={'User Avatar'} className='rounded-lg' />
        </Avatar>
    );
}
