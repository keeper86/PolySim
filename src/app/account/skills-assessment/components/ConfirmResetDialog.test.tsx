import { DEFAULT_RESET_DIALOG_TITLE, DEFAULT_RESET_DIALOG_CONFIRM, DEFAULT_RESET_DIALOG_CANCEL } from './testUtils';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmResetDialog } from './ConfirmResetDialog';
import { vi, expect, describe, it } from 'vitest';

describe('ConfirmResetDialog', () => {
    it('renders dialog with confirm and cancel buttons', () => {
        render(<ConfirmResetDialog open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText(DEFAULT_RESET_DIALOG_TITLE)).toBeInTheDocument();
        expect(screen.getByText(DEFAULT_RESET_DIALOG_CANCEL)).toBeInTheDocument();
        expect(screen.getByText(DEFAULT_RESET_DIALOG_CONFIRM)).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        render(<ConfirmResetDialog open={true} onConfirm={onConfirm} onCancel={vi.fn()} />);
        fireEvent.click(screen.getByText(DEFAULT_RESET_DIALOG_CONFIRM));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<ConfirmResetDialog open={true} onConfirm={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText(DEFAULT_RESET_DIALOG_CANCEL));
        expect(onCancel).toHaveBeenCalled();
    });

    it('does not render dialog content when open is false', () => {
        render(<ConfirmResetDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.queryByText(DEFAULT_RESET_DIALOG_TITLE)).not.toBeInTheDocument();
    });
});
