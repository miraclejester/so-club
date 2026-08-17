'use client';

import { JSX, useState, useTransition } from 'react';
import type { MediaSource } from '@/lib/media';
import type { AddAction, AddResult } from '@/lib/media/backlog';
import { Button } from '@/components/ui/button';

type AddToBacklogButtonProps = {
    source: MediaSource;
    externalId: string;
    action: AddAction;
    alreadyInBacklog: boolean;
};

export default function AddToBacklogButton({
    source,
    externalId,
    action,
    alreadyInBacklog,
}: AddToBacklogButtonProps): JSX.Element {
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<AddResult | null>(null);

    function handleClick() {
        startTransition(async () => {
            setResult(await action(source, externalId));
        });
    }

    const inBacklog = alreadyInBacklog || result?.status === 'added' || result?.status === 'duplicate';

    return (
        <div className="mt-1">
            <Button
                onClick={handleClick}
                disabled={pending || inBacklog}
                size="sm"
                variant="outline"
                className="w-full"
            >
                {pending ? 'Adding...' : inBacklog ? 'In backlog' : 'Add to backlog'}
            </Button>
            {result?.status === 'error' ? <p className="mt-1 text-xs text-red-600">{result.message}</p> : null}
        </div>
    );
}
