'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmResetDialogProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConfirmResetDialog({ open, onCancel, onConfirm }: ConfirmResetDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Ratings?</DialogTitle>
                    <DialogDescription>
                        This entry has sub-skills with a non-zero rating. Do you want to reset the ratings for the
                        sub-skills as well?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex gap-2 justify-end'>
                    <Button variant='outline' onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant='destructive' onClick={onConfirm}>
                        Reset all ratings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
