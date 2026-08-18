'use client';

import { JSX, useState, useTransition } from 'react';
import { removeFromBacklog } from '@/lib/media/backlog';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/lib/types';

type RemoveFromBacklogButtonProps = {
    backlogItemId: string;
};

export default function RemoveFromBacklogButton({ backlogItemId }: RemoveFromBacklogButtonProps): JSX.Element {
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<ErrorState>({ error: null });

    function handleRemove() {
        startTransition(async () => {
            const result = await removeFromBacklog(backlogItemId);
            if (result.status === 'error') {
                setError({ error: result.message ?? 'Could not remove item' });
                setConfirming(false);
            }
        });
    }

    function startRemovalConfirmation() {
        setError({ error: null });
        setConfirming(true);
    }

    if (confirming) {
        return (
            <div className="mt-1 flex items-center gap-1">
                <Button size="sm" variant="destructive" onClick={handleRemove} disabled={pending}>
                    {pending ? 'Removing...' : 'Remove'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-1">
            <Button size="sm" variant="ghost" onClick={startRemovalConfirmation}>
                Remove
            </Button>
            {error?.error ? <p className="text-xs text-red-600">{error.error}</p> : null}
        </div>
    );
}
