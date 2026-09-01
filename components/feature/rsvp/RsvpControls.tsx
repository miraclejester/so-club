'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';
import { setRsvp } from '@/lib/rsvp/actions';
import { getRsvpOptions } from '@/lib/rsvp/data';
import type { ActionResult } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import { FormError } from '@/components/ui/form-error';

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
                {getRsvpOptions().map((opt) => (
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
            {result.ok ? null : <FormError className="mt-2">{result.error}</FormError>}
        </>
    );
}
