import { JSX } from 'react';

import Link from 'next/link';
export type SidebarNavItem = {
    link: JSX.Element;
    children?: SidebarNavItem[];
};

export const sidebarNavTree: SidebarNavItem[] = [
    {
        link: <Link href='/projects'>Projects</Link>,
        children: [
            {
                link: <Link href='/projects/create'>Create Project</Link>,
            },
        ],
    },
    {
        link: <Link href='/analysis'>Analysis</Link>,
        children: [],
    },
    {
        link: <Link href='/files'>Files</Link>,
        children: [],
    },
];
