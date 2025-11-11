'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export default function BackToTopButton() {
    const [isVisible, setIsVisible] = useState(false);
    const { state, isMobile } = useSidebar();

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const edgeMargin = '1.25rem';

    const leftPosition = state === 'expanded' && !isMobile ? `calc(var(--sidebar-width) + ${edgeMargin})` : edgeMargin;

    return (
        <div className='fixed bottom-5 z-50 transition-all duration-200 ease-linear' style={{ left: leftPosition }}>
            {isVisible && (
                <Button
                    onClick={scrollToTop}
                    variant='outline'
                    size='icon'
                    className='shadow-lg
                     bg-green-700
                     text-white
                     hover:bg-green-500'
                    aria-label='Back to top'
                >
                    &uarr;
                </Button>
            )}
        </div>
    );
}
