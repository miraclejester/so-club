'use client';

import { JSX, useTransition } from 'react';
import { setRsvp } from '@/lib/groups/invites';
import { Button } from '@/components/ui/button';
import type { RsvpStatus } from '@/prisma/generated/prisma/client';
import { RsvpOption } from '@/app/groups/[id]/sessions/[sessionId]/page';

type RsvpControlsProps = {
    sessionId: string;
    currentStatus: RsvpStatus | null;
};

const OPTIONS: RsvpOption[] = [
    { value: 'GOING', label: 'Going' },
    { value: 'MAYBE', label: 'Maybe' },
    { value: 'NOT_GOING', label: "Can't Go" },
];

export default function RsvpControls({ sessionId, currentStatus }: RsvpControlsProps): JSX.Element {
    const [pending, startTransition] = useTransition();

    function onOptionClicked(value: RsvpStatus) {
        startTransition(async () => {
            await setRsvp(sessionId, value);
        });
    }

    return (
        <div className="flex gap-2">
            {OPTIONS.map((opt) => (
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
    );
}
