'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/layout/SubmitButton';
import type { ActionResult } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import type { Invite } from '@/prisma/generated/prisma/client';
import { LocalDateTime } from '@/components/layout/LocalDateTime';
import { useClientValue } from '@/hooks/useClientValue';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type InvitePanelProps = {
    action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
    revokeAction: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
    invite: Invite | null;
};

export function InvitePanel({ action, revokeAction, invite }: InvitePanelProps) {
    const [state, formAction] = useActionState(action, ok());
    const [revokeState, revokeFormAction] = useActionState(revokeAction, ok());
    const [copied, setCopied] = useState(false);

    async function copyLink(inviteUrl: string) {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const origin: string = useClientValue(
        () => window.location.origin,
        () => ''
    );

    const token = invite?.token ?? null;
    const inviteUrl = token ? `${origin}/invite/${token}` : null;

    return (
        <div className="mt-6 border-t pt-4">
            <form action={formAction}>
                <SubmitButton pendingText="Generating...">
                    {invite !== null ? 'Generate new link' : 'Create invite link'}
                </SubmitButton>
            </form>
            {state.ok ? null : <FormError>{state.error}</FormError>}
            {invite !== null ? (
                <>
                    <form className="mt-1" action={revokeFormAction}>
                        <SubmitButton pendingText="Revoking...">Revoke invitation</SubmitButton>
                    </form>
                    {revokeState.ok ? null : <FormError>{revokeState.error}</FormError>}
                    <div className="mt-1">
                        <span>
                            Expiry Date:{' '}
                            {invite.expiresAt ? <LocalDateTime iso={invite.expiresAt.toISOString()} /> : `Never`}
                        </span>
                    </div>
                </>
            ) : null}

            {inviteUrl ? (
                <div className="mt-3 flex items-center gap-2">
                    <Input readOnly value={inviteUrl} className="w-full rounded border px-2 py-1 text-sm" />
                    <Button
                        onClick={() => {
                            void copyLink(inviteUrl);
                        }}
                        className="rounded border px-2 py-1 text-sm"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
