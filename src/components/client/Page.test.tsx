import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Page } from './Page';

describe('Page', () => {
    it('renders with title', () => {
        render(<Page title='Test Page' />);
        expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('renders children', () => {
        render(
            <Page title='Test Page'>
                <div>Child content</div>
            </Page>,
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders header component', () => {
        render(<Page title='Test Page' headerComponent={<button>Action</button>} />);
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('applies custom className to header', () => {
        const { container } = render(<Page title='Test Page' className='custom-header' />);
        const header = container.querySelector('.custom-header');
        expect(header).toBeInTheDocument();
    });

    it('renders title as h1', () => {
        render(<Page title='Test Page' />);
        const heading = screen.getByRole('heading', { level: 1, name: 'Test Page' });
        expect(heading).toBeInTheDocument();
    });
});
