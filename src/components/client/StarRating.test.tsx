import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from './StarRating';

describe('StarRating', () => {
    it('renders stars with correct filled state', () => {
        const { container } = render(<StarRating level={2} />);
        const stars = container.querySelectorAll('svg');
        expect(stars).toHaveLength(3);
    });

    it('calls onChange when star is clicked', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        const { container } = render(<StarRating level={1} onChange={onChange} />);

        const buttons = container.querySelectorAll('button');
        await user.click(buttons[1]);

        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('renders delete button when onDelete is provided', () => {
        const onDelete = vi.fn();
        render(<StarRating level={2} onDelete={onDelete} />);

        const deleteButton = screen.getByLabelText('Reset to no experience');
        expect(deleteButton).toBeInTheDocument();
    });

    it('disables delete button when level is 0', () => {
        const onDelete = vi.fn();
        render(<StarRating level={0} onDelete={onDelete} />);

        const deleteButton = screen.getByLabelText('Reset to no experience');
        expect(deleteButton).toBeDisabled();
    });

    it('renders custom number of stars', () => {
        const { container } = render(<StarRating level={3} maxStars={5} />);
        const stars = container.querySelectorAll('svg');
        expect(stars).toHaveLength(5);
    });
});
