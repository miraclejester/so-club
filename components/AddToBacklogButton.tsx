'use client';

import { JSX, useState, useTransition } from 'react';
import type { MediaSource } from '@/lib/media';
import type { AddAction, AddResult } from '@/lib/media/backlog';

type AddToBacklogButtonProps = {
    source: MediaSource;
    externalId: string;
    action: AddAction;
};

export default function AddToBacklogButton({ source, externalId, action }: AddToBacklogButtonProps): JSX.Element {
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<AddResult | null>(null);

    function handleClick() {
        startTransition(async () => {
            setResult(await action(source, externalId));
        });
    }

    const inBacklog = result?.status === 'added' || result?.status === 'duplicate';

    return (
        <div className="mt-1">
            <button
                onClick={handleClick}
                disabled={pending || inBacklog}
                className="w-full rounded border px-2 py-1 text-xs disabled:opacity-50"
            >
                {pending ? 'Adding...' : inBacklog ? 'In backlog' : 'Add to backlog'}
            </button>
            {result?.status === 'error' ? <p className="mt-1 text-xs text-red-600">{result.message}</p> : null}
        </div>
    );
}
