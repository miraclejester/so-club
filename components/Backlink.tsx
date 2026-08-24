import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BacklinkProps = {
    href: string;
    className?: string;
    children?: ReactNode;
};

export function Backlink({ href, className, children }: BacklinkProps) {
    return (
        <Link href={href} className={cn('text-sm text-muted-foreground hover:underline', className)}>
            {children}
        </Link>
    );
}
