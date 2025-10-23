import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SyncStatusIndicator } from './SyncStatusIndicator';

describe('SyncStatusIndicator', () => {
    it('renders successfully for success status', () => {
        const { container } = render(<SyncStatusIndicator status='success' />);
        const wrapper = container.querySelector('div');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass('flex', 'items-center');
    });

    it('renders successfully for pending status', () => {
        const { container } = render(<SyncStatusIndicator status='pending' />);
        const wrapper = container.querySelector('div');
        expect(wrapper).toBeInTheDocument();
    });

    it('renders successfully for error status', () => {
        const { container } = render(<SyncStatusIndicator status='error' />);
        const wrapper = container.querySelector('div');
        expect(wrapper).toBeInTheDocument();
    });

    it('renders successfully for idle status', () => {
        const { container } = render(<SyncStatusIndicator status='idle' />);
        const wrapper = container.querySelector('div');
        expect(wrapper).toBeInTheDocument();
    });
});
