import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
    it('renders with default message', () => {
        render(<LoadingState />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        render(<LoadingState message='Loading skills assessment…' />);
        expect(screen.getByText('Loading skills assessment…')).toBeInTheDocument();
    });

    it('renders spinner', () => {
        const { container } = render(<LoadingState />);
        const spinner = container.querySelector('svg');
        expect(spinner).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<LoadingState className='custom-class' />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('custom-class');
    });

    it('applies custom minHeight', () => {
        const { container } = render(<LoadingState minHeight='min-h-[600px]' />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('min-h-[600px]');
    });
});
