'use client';

import { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
    children: ReactNode;
    pendingText: string;
    className?: string;
};

export function SubmitButton({
    children,
    pendingText,
    className = 'rounded border px-3 py-1 disabled:opacity-50',
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className={className}>
            {pending ? (pendingText ?? children) : children}
        </button>
    );
}
