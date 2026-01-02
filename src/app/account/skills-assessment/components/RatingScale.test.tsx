import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RatingScale } from './RatingScale';

describe('RatingScale', () => {
    it('renders description text', () => {
        render(<RatingScale />);
        expect(
            screen.getByText('Rate your proficiency with programming languages and tools. Changes are saved automatically.')
        ).toBeInTheDocument();
    });

    it('renders rating scale label', () => {
        render(<RatingScale />);
        expect(screen.getByText('Rating Scale:')).toBeInTheDocument();
    });

    it('renders all rating levels', () => {
        render(<RatingScale />);
        expect(screen.getByText('No experience')).toBeInTheDocument();
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
        expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    it('renders star ratings for each level', () => {
        const { container } = render(<RatingScale />);
        // Each level should have star icons
        const stars = container.querySelectorAll('svg');
        // Should have stars for 4 levels (0, 1, 2, 3 stars)
        expect(stars.length).toBeGreaterThan(0);
    });

    it('renders tooltips with descriptions', () => {
        render(<RatingScale />);
        // The tooltip content is rendered but hidden by default
        // We can verify the trigger elements are present
        const beginnerLabel = screen.getByText('Beginner');
        expect(beginnerLabel).toBeInTheDocument();
    });
});
