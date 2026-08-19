'use client';

import { useActionState, useState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { ActionResult } from '@/lib/actions/result';
import FormError from '@/components/FormError';

type InvitePanelResult = ActionResult<{ token: string | null }>;

const initialState: InvitePanelResult = { ok: true, data: { token: null } };

type InvitePanelProps = {
    action: (prev: InvitePanelResult, formData: FormData) => Promise<InvitePanelResult>;
    origin: string;
};

export default function InvitePanel({ action, origin }: InvitePanelProps) {
    const [state, formAction] = useActionState(action, initialState);
    const [copied, setCopied] = useState(false);

    const inviteUrl = state.ok && state.data.token ? `${origin}/invite/${state.data.token}` : null;

    return (
        <div className="mt-6 border-t pt-4">
            <form action={formAction}>
                <SubmitButton pendingText="Generating...">Create invite link</SubmitButton>
            </form>
            {state.ok ? null : <FormError>{state.error}</FormError>}

            {inviteUrl ? (
                <div className="mt-3 flex items-center gap-2">
                    <input readOnly value={inviteUrl} className="w-full rounded border px-2 py-1 text-sm" />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(inviteUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        }}
                        className="rounded border px-2 py-1 text-sm"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
