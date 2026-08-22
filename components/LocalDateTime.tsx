'use client';

import { useClientValue } from '@/lib/hooks';

type Style = 'full' | 'long' | 'medium' | 'short';

type LocalDateTimeProps = {
    iso: string;
    dateStyle?: Style;
    timeStyle?: Style;
};

export function LocalDateTime({ iso, dateStyle = 'full', timeStyle = 'short' }: LocalDateTimeProps) {
    const text = useClientValue(
        () => new Date(iso).toLocaleString(undefined, { dateStyle, timeStyle }),
        () => new Date(iso).toLocaleString(undefined, { timeZone: 'UTC', dateStyle, timeStyle })
    );

    return (
        <time suppressHydrationWarning dateTime={iso}>
            {text}
        </time>
    );
}
