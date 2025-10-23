import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import React from 'react';

interface TextInputWithButtonProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    buttonLabel?: string;
    buttonIconOnly?: boolean;
    disabled?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export const TextInputWithButton: React.FC<TextInputWithButtonProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder,
    buttonLabel,
    disabled = false,
    inputProps,
    buttonProps,
}) => {
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <div className='flex gap-2'>
            <Input
                type='text'
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={disabled}
                {...inputProps}
            />
            <Button type='button' onClick={onSubmit} disabled={disabled} {...buttonProps}>
                <Plus className='w-4 h-4 cursor-pointer' />
                {buttonLabel}
            </Button>
        </div>
    );
};
