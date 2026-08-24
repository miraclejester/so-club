'use client';

import { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

type SubmitButtonProps = ComponentProps<typeof Button> & {
    pendingText: string;
};

export function SubmitButton({ children, pendingText, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending || props.disabled} {...props}>
            {pending ? (pendingText ?? children) : children}
        </Button>
    );
}
