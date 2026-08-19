'use client';

import { JSX, useSyncExternalStore } from 'react';

type Style = 'full' | 'long' | 'medium' | 'short';

type LocalDateTimeProps = {
    iso: string;
    dateStyle?: Style;
    timeStyle?: Style;
};

const subscribe = () => () => {};

export default function LocalDateTime({
    iso,
    dateStyle = 'full',
    timeStyle = 'short',
}: LocalDateTimeProps): JSX.Element {
    const text = useSyncExternalStore(
        subscribe,
        () => new Date(iso).toLocaleString(undefined, { dateStyle, timeStyle }),
        () => new Date(iso).toISOString().slice(0, 10)
    );

    return <time dateTime={iso}>{text}</time>;
}
