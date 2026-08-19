'use client';

import { JSX, useEffect, useState } from 'react';

type Style = 'full' | 'long' | 'medium' | 'short';

type LocalDateTimeProps = {
    iso: string;
    dateStyle?: Style;
    timeStyle?: Style;
};

// TODO Temporary. App-wide date treatment coming later
export default function LocalDateTime({
    iso,
    dateStyle = 'full',
    timeStyle = 'short',
}: LocalDateTimeProps): JSX.Element {
    const [text, setText] = useState('');

    useEffect(() => {
        setText(new Date(iso).toLocaleString(undefined, { dateStyle, timeStyle }));
    }, [iso]);
    return <span suppressHydrationWarning>{text ?? '...'}</span>;
}
