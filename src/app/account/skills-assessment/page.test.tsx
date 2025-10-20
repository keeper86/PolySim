import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import React from 'react';

import SkillsAssessmentPage from './page';

let assessment = [
    { category: 'Languages', skills: [{ name: 'TypeScript', level: 2 }] },
    { category: 'Tools', skills: [{ name: 'Git', level: 3 }] },
];

let isLoading = false;
let saveMutation = { isPending: false, isError: false };

let publishStatus = false;
let isPublishStatusLoading = false;

const mockMutate = vi.fn();

const addItemMock = vi.fn();
const updateItemLevelMock = vi.fn();

vi.mock('./hooks/useSkillsAssessment', () => ({
    useSkillsAssessment: () => ({
        skillsQuery: { data: assessment, isLoading },
        saveMutation,
    }),
}));

vi.mock('./hooks/usePublishSkillsAssessment', () => ({
    usePublishSkillsAssessment: () => ({
        publishStatus,
        isPublishStatusLoading,
        mutateAssessmentPublishStatus: { mutate: mockMutate },
    }),
}));

vi.mock('./hooks/useSkillsAssessmentActions', () => ({
    useSkillsAssessmentActions: () => ({
        addItemToCategory: addItemMock,
        updateItemLevel: updateItemLevelMock,
        resetSkillRatings: vi.fn(),
        setSkillLevel: vi.fn(),
        deleteCustomSkill: vi.fn(),
        updateSubSkillLevel: vi.fn(),
        addSubSkillToItem: vi.fn(),
        deleteCustomSubSkill: vi.fn(),
    }),
}));

vi.mock('./components/ConfirmResetDialog', () => ({
    ConfirmResetDialog: ({ open }: { open?: boolean }) => (
        <div data-testid='confirm-reset' data-open={open ? 'true' : 'false'} />
    ),
}));

vi.mock('@/components/shared/SyncStatusIndicator', () => ({
    SyncStatusIndicator: ({ status }: { status: 'pending' | 'success' | 'error' }) => (
        <div data-testid='sync-status'>{status}</div>
    ),
}));

describe('SkillsAssessmentPage', () => {
    beforeEach(() => {
        assessment = [
            { category: 'Languages', skills: [{ name: 'TypeScript', level: 2 }] },
            { category: 'Tools', skills: [{ name: 'Git', level: 3 }] },
        ];
        isLoading = false;
        saveMutation = { isPending: false, isError: false };
        publishStatus = false;
        isPublishStatusLoading = false;
        mockMutate.mockReset();
        addItemMock.mockReset();
        updateItemLevelMock.mockReset();
    });

    it('renders header, categories, publish switch and download button', async () => {
        render(<SkillsAssessmentPage />);

        expect(screen.getByRole('heading', { name: /Skills Assessment/i })).toBeInTheDocument();

        expect(screen.getByText(/Rating Scale/i)).toBeInTheDocument();

        const languagesMatches = screen.getAllByText(/Languages/i);
        expect(languagesMatches.some((el) => el.tagName === 'SPAN')).toBeTruthy();

        const toolsMatches = screen.getAllByText(/Tools/i);
        expect(toolsMatches.some((el) => el.tagName === 'SPAN')).toBeTruthy();

        expect(screen.getByTestId('sync-status').textContent).toBe('success');

        expect(screen.getByText(/Publish/i)).toBeInTheDocument();
        const publishSwitch = screen.getByRole('switch');
        expect(publishSwitch).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(publishSwitch);
        await waitFor(() => expect(mockMutate).toHaveBeenCalledWith(true));

        expect(screen.getByRole('button', { name: /Download Data as JSON/i })).toBeInTheDocument();
    });

    it('shows loading state when skills query or publish status is loading', () => {
        isLoading = true;
        render(<SkillsAssessmentPage />);

        expect(screen.queryByRole('heading', { name: /Skills Assessment/i })).toBeNull();
    });

    it('adds a custom skill when using the input and button', async () => {
        render(<SkillsAssessmentPage />);

        const input = screen.getByPlaceholderText('Add to Languages');
        fireEvent.change(input, { target: { value: 'MyCustomSkill' } });

        const container = input.closest('div');
        expect(container).toBeTruthy();
        const addButton = within(container as HTMLElement).getByRole('button', { name: /Add Skill/i });
        fireEvent.click(addButton);

        expect(addItemMock).toHaveBeenCalledWith('Languages', 'MyCustomSkill');
    });

    it('updates the item level when clicking a star inside a skill item', async () => {
        render(<SkillsAssessmentPage />);

        const skillText = screen.getByText('TypeScript');
        const skillContainer = skillText.closest('div');
        expect(skillContainer).toBeTruthy();

        const withinContainer = within(skillContainer as HTMLElement);
        const starButton = withinContainer.getByRole('button', { name: 'Set level to 3' });

        fireEvent.click(starButton);

        expect(updateItemLevelMock).toHaveBeenCalledWith('Languages', 0, 3);
    });
});
