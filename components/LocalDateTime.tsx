'use client';

import { JSX, useEffect, useState } from 'react';

type LocalDateTimeProps = {
    iso: string;
};

// TODO Temporary. App-wide date treatment coming later
export default function LocalDateTime({ iso }: LocalDateTimeProps): JSX.Element {
    const [text, setText] = useState('');

    useEffect(() => {
        setText(new Date(iso).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }));
    }, [iso]);
    return <span suppressHydrationWarning>{text ?? '...'}</span>;
}
