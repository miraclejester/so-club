import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function localToUTC(local: string): string {
    if (!local) {
        return '';
    }
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
