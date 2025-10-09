import { render, screen, fireEvent } from '@testing-library/react';
import { SubSkillItem } from './SubSkillItem';
import { expect, describe, it, vi } from 'vitest';
import { sampleSubSkill, DEFAULT_SUBSKILL_NAME, DEFAULT_CATEGORY_NAME } from './testUtils';

describe('SubSkillItem', () => {
    it('renders sub-skill name and rating', () => {
        render(
            <SubSkillItem
                item={sampleSubSkill}
                parentName={DEFAULT_CATEGORY_NAME}
                onLevelChange={vi.fn()}
                onDelete={vi.fn()}
            />,
        );
        expect(screen.getByText(DEFAULT_SUBSKILL_NAME)).toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', () => {
        const onDelete = vi.fn();
        render(
            <SubSkillItem
                item={sampleSubSkill}
                parentName={DEFAULT_CATEGORY_NAME}
                onLevelChange={vi.fn()}
                onDelete={onDelete}
            />,
        );
        const deleteBtn = screen.getByLabelText('Delete sub-skill');
        fireEvent.click(deleteBtn);
        expect(onDelete).toHaveBeenCalled();
    });

    it('calls onLevelChange when rating is changed', () => {
        const onLevelChange = vi.fn();
        render(
            <SubSkillItem
                item={sampleSubSkill}
                parentName={DEFAULT_CATEGORY_NAME}
                onLevelChange={onLevelChange}
                onDelete={vi.fn()}
            />,
        );
        expect(screen.getByText(DEFAULT_SUBSKILL_NAME)).toBeInTheDocument();
    });

    it('calls onLevelChange with 0 when delete rating is triggered', () => {
        const onLevelChange = vi.fn();
        render(
            <SubSkillItem
                item={sampleSubSkill}
                parentName={DEFAULT_CATEGORY_NAME}
                onLevelChange={onLevelChange}
                onDelete={vi.fn()}
            />,
        );

        const deleteBtn = screen.getByLabelText('Reset to no experience');
        fireEvent.click(deleteBtn);
        expect(onLevelChange).toHaveBeenCalledWith(0);
    });
});
