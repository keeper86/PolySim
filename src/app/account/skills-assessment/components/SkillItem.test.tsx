import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SkillItem } from './SkillItem';
import {
    DEFAULT_CATEGORY_NAME,
    DEFAULT_RESET_DIALOG_TITLE,
    DEFAULT_SKILL_NAME,
    mockActions,
    sampleSkill,
} from './testUtils';

describe('SkillItem', () => {
    beforeEach(() => {
        Object.values(mockActions).forEach((fn) => fn.mockClear());
    });

    it('renders skill name and rating', () => {
        render(<SkillItem skill={sampleSkill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        expect(screen.getByText(DEFAULT_SKILL_NAME)).toBeInTheDocument();
    });

    it('calls deleteCustomSkill when delete is clicked and no rated sub-skills', () => {
        const skill = { name: 'CustomSkill', level: 1, subSkills: [] };
        render(<SkillItem skill={skill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        const deleteBtn = screen.getByLabelText('Delete skill');
        fireEvent.click(deleteBtn);
        expect(mockActions.deleteCustomSkill).toHaveBeenCalledWith(DEFAULT_CATEGORY_NAME, 0);
    });

    it('shows reset dialog if sub-skills are rated', async () => {
        render(<SkillItem skill={sampleSkill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        const deleteBtns = screen.getAllByLabelText('Reset to no experience');
        fireEvent.click(deleteBtns[0]);
        expect(await screen.findByText((content) => content.includes(DEFAULT_RESET_DIALOG_TITLE))).toBeInTheDocument();
    });

    it('calls deleteCustomSkill when deleting custom skill', async () => {
        const skill = { name: 'CustomSkill', level: 1, subSkills: [{ name: 'Sub', level: 2 }] };
        render(<SkillItem skill={skill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        const deleteBtn = screen.getByLabelText('Delete skill');
        fireEvent.click(deleteBtn);
        expect(mockActions.deleteCustomSkill).toHaveBeenCalledWith(DEFAULT_CATEGORY_NAME, 0);
    });

    it('does not render delete button for default skills', () => {
        const defaultSkill = { ...sampleSkill, name: DEFAULT_SKILL_NAME };
        render(
            <SkillItem skill={defaultSkill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />,
        );
        expect(screen.queryByLabelText('Delete skill')).not.toBeInTheDocument();
    });

    it('calls updateItemLevel when rating is changed', () => {
        render(<SkillItem skill={sampleSkill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        const starBtn = screen.getAllByLabelText('Set level to 2').at(0);
        expect(starBtn).toBeDefined();
        fireEvent.click(starBtn!);
        expect(mockActions.updateItemLevel).toHaveBeenCalledWith(DEFAULT_CATEGORY_NAME, 0, 2);
    });

    it('calls updateItemLevel with 0 when deleting rating and no rated sub-skills', () => {
        const skill = { name: 'CustomSkill', level: 2, subSkills: [] };
        render(<SkillItem skill={skill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);

        const deleteBtn = screen.getByLabelText('Reset to no experience');
        fireEvent.click(deleteBtn);
        expect(mockActions.updateItemLevel).toHaveBeenCalledWith(DEFAULT_CATEGORY_NAME, 0, 0);
    });

    it('renders skill with special characters in name', () => {
        const skill = { ...sampleSkill, name: 'Skill!@#' };
        render(<SkillItem skill={skill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);
        expect(screen.getByText('Skill!@#')).toBeInTheDocument();
    });

    it('collapses and expands sub-skills section', () => {
        const skill = { ...sampleSkill, level: 2 };
        render(<SkillItem skill={skill} skillIndex={0} category={DEFAULT_CATEGORY_NAME} actions={mockActions} />);

        let chevronBtn = screen.getByRole('button', { name: /collapse sub-skills/i });
        let container = screen.getByText('Sub-Skills').closest('button')?.parentElement?.nextElementSibling;
        expect(container).toBeDefined();
        expect(container?.className).not.toContain('max-h-0');

        fireEvent.click(chevronBtn);
        chevronBtn = screen.getByRole('button', { name: /expand sub-skills/i });
        container = screen.getByText('Sub-Skills').closest('button')?.parentElement?.nextElementSibling;
        expect(container?.className).toContain('max-h-0');

        fireEvent.click(chevronBtn);
        chevronBtn = screen.getByRole('button', { name: /collapse sub-skills/i });
        container = screen.getByText('Sub-Skills').closest('button')?.parentElement?.nextElementSibling;
        expect(container?.className).not.toContain('max-h-0');
    });
});
