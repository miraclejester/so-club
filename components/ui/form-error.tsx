import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FormErrorProps = {
    children?: ReactNode;
    className?: string;
};

export function FormError({ children, className }: FormErrorProps) {
    return <p className={cn('text-sm text-destructive', className)}>{children}</p>;
}
