import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySection } from './CategorySection';
import { expect, describe, it, beforeEach } from 'vitest';
import {
    mockActions,
    sampleCategory,
    DEFAULT_CATEGORY_NAME,
    DEFAULT_SKILL_NAME,
    DEFAULT_SECOND_SKILL_NAME,
    DEFAULT_ADD_SKILL_PLACEHOLDER,
    DEFAULT_ADD_SKILL_BUTTON,
} from './testUtils';

describe('CategorySection', () => {
    beforeEach(() => {
        Object.values(mockActions).forEach((fn) => fn.mockClear());
    });

    it('renders category title', () => {
        render(<CategorySection categoryObj={sampleCategory} actions={mockActions} />);
        expect(screen.getByText(DEFAULT_CATEGORY_NAME)).toBeInTheDocument();
    });

    it('renders all skills in the category', () => {
        render(<CategorySection categoryObj={sampleCategory} actions={mockActions} />);
        expect(screen.getByText(DEFAULT_SKILL_NAME)).toBeInTheDocument();
        expect(screen.getByText(DEFAULT_SECOND_SKILL_NAME)).toBeInTheDocument();
    });

    it('collapses and expands the section', () => {
        render(<CategorySection categoryObj={sampleCategory} actions={mockActions} />);
        const button = screen.getByRole('button', { name: /collapse category/i });
        fireEvent.click(button);

        const container = button.parentElement?.querySelector('div.transition-all');
        expect(container).toHaveClass('max-h-0');
        expect(container).toHaveClass('opacity-0');
        fireEvent.click(button);
        expect(container).not.toHaveClass('max-h-0');
        expect(container).not.toHaveClass('opacity-0');
    });

    it('adds a new skill', () => {
        render(<CategorySection categoryObj={sampleCategory} actions={mockActions} />);
        const input = screen.getByPlaceholderText(DEFAULT_ADD_SKILL_PLACEHOLDER(DEFAULT_CATEGORY_NAME));
        fireEvent.change(input, { target: { value: 'NewSkill' } });
        const addButton = screen.getByText(DEFAULT_ADD_SKILL_BUTTON);
        fireEvent.click(addButton);
        expect(mockActions.addItemToCategory).toHaveBeenCalledWith(DEFAULT_CATEGORY_NAME, 'NewSkill');
    });
});
