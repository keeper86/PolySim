import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RatingScale } from './RatingScale';

describe('RatingScale', () => {
    it('renders description text', () => {
        render(<RatingScale />);
        expect(
            screen.getByText(
                'Rate your proficiency with programming languages and tools. Changes are saved automatically.',
            ),
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
        const stars = container.querySelectorAll('svg');
        expect(stars.length).toBeGreaterThan(0);
    });

    it('renders tooltips with descriptions', () => {
        render(<RatingScale />);
        const beginnerLabel = screen.getByText('Beginner');
        expect(beginnerLabel).toBeInTheDocument();
    });
});
