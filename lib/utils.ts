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

export function formatYear(value: Date | string | null): string {
    if (!value) {
        return '--';
    }

    if (value instanceof Date) {
        return value.getFullYear().toString();
    }

    return value.slice(0, 4);
}
