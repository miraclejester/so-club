'use client';

import { useState, useTransition } from 'react';
import { removeFromBacklog } from '@/lib/media/backlog/actions';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/actions/result';
import { ok, fail } from '@/lib/actions/result';
import { FormError } from '@/components/ui/form-error';
import { ActionError } from '@/components/layout/ActionError';

type RemoveFromBacklogButtonProps = {
    backlogItemId: string;
    isScheduled: boolean;
};

export function RemoveFromBacklogButton({ backlogItemId, isScheduled }: RemoveFromBacklogButtonProps) {
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState<ActionResult>(ok());

    function handleRemove() {
        startTransition(async () => {
            const result = await removeFromBacklog(backlogItemId);
            if (!result.ok) {
                setResult(fail(result.error));
                setConfirming(false);
            }
        });
    }

    function startRemovalConfirmation() {
        setResult(ok());
        setConfirming(true);
    }

    if (confirming) {
        return (
            <div className="mt-1 flex items-center gap-1">
                {isScheduled ? <FormError>The scheduled session and all rsvps will be removed</FormError> : null}
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
            <ActionError result={result} />
        </div>
    );
}
