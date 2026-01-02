import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
    it('renders with default title and description', () => {
        render(<ErrorState />);
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong. Please try again later.')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
        render(<ErrorState title='Custom Error' />);
        expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('renders with custom description', () => {
        render(<ErrorState description='Custom error message' />);
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
        render(<ErrorState title='Not Found' description='The requested resource was not found.' />);
        expect(screen.getByText('Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested resource was not found.')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<ErrorState className='custom-error' />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('custom-error');
    });
});
