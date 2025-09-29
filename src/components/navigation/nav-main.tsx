'use client';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar';
import type { SidebarNavItem } from './sidebar-nav-tree';
import { sidebarNavTree } from './sidebar-nav-tree';

function NavTree({ item, level = 1 }: { item: SidebarNavItem; level?: number }) {
    // Define styles for each level (1, 2, 3+)
    let buttonClass = '';
    let subMenuClass = '';
    if (level === 1) {
        buttonClass = 'font-semibold';
        subMenuClass = '';
    } else if (level === 2) {
        buttonClass = 'font-normal text-sm pl-2 opacity-80';
        subMenuClass = 'mx-0 px-1 border-l';
    } else if (level >= 3) {
        buttonClass = 'font-normal text-xs pl-3 opacity-60';
        subMenuClass = 'mx-0 px-0.5 border-l border-dashed';
    }
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild className={buttonClass}>
                {item.link}
            </SidebarMenuButton>
            {level < 2 && (
                <SidebarMenuSub className={subMenuClass}>
                    {item.children?.map((subItem, idx) => (
                        <NavTree key={idx} item={subItem} level={level + 1} />
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}

export function NavMain() {
    return (
        <SidebarMenu>
            {sidebarNavTree.map((item, idx) => (
                <NavTree key={idx} item={item} level={1} />
            ))}
        </SidebarMenu>
    );
}
