'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';
import { setRsvp } from '@/lib/rsvp/actions';
import { RSVP_OPTIONS } from '@/lib/rsvp/labels';
import type { ActionResult } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import { ActionError } from '@/components/ui/action-error';

type RsvpControlsProps = {
    sessionId: string;
    currentStatus: RsvpStatus | null;
};

export function RsvpControls({ sessionId, currentStatus }: RsvpControlsProps) {
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult>(ok());

    function onOptionClicked(value: RsvpStatus) {
        setResult(ok());
        startTransition(async () => {
            setResult(await setRsvp(sessionId, value));
        });
    }

    return (
        <>
            <div className="flex gap-2">
                {RSVP_OPTIONS.map((opt) => (
                    <Button
                        key={opt.value}
                        size="sm"
                        variant={currentStatus === opt.value ? 'default' : 'outline'}
                        disabled={pending}
                        onClick={() => onOptionClicked(opt.value)}
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
            <ActionError result={result} className="mt-2" />
        </>
    );
}
