import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeadingProps = {
    children: ReactNode;
    className?: string;
};

export function PageHeading({ children, className }: PageHeadingProps) {
    return <h1 className={cn('mt-2 text-xl font-semibold', className)}>{children}</h1>;
}
