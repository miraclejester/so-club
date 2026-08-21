'use client';

import { JSX } from 'react';
import { useClientValue } from '@/lib/hooks';

type Style = 'full' | 'long' | 'medium' | 'short';

type LocalDateTimeProps = {
    iso: string;
    dateStyle?: Style;
    timeStyle?: Style;
};

export default function LocalDateTime({
    iso,
    dateStyle = 'full',
    timeStyle = 'short',
}: LocalDateTimeProps): JSX.Element {
    const text = useClientValue(
        () => new Date(iso).toLocaleString(undefined, { dateStyle, timeStyle }),
        () => new Date(iso).toISOString().slice(0, 10)
    );

    return <time dateTime={iso}>{text}</time>;
}
