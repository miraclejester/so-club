'use client';

import { useActionState, useState } from 'react';

type InvitePanelInviteState = {
    token: string | null;
    error: string | null;
};

const initialState: InvitePanelInviteState = { token: null, error: null };

type InvitePanelProps = {
    action: (
        prev: InvitePanelInviteState,
        formData: FormData
    ) => Promise<InvitePanelInviteState>;
    origin: string;
};

export default function InvitePanel({ action, origin }: InvitePanelProps) {
    const [state, formAction, pending] = useActionState(action, initialState);
    const [copied, setCopied] = useState(false);

    const inviteUrl = state.token ? `${origin}/invite/${state.token}` : null;

    return (
        <div className="mt-6 border-t pt-4">
            <form action={formAction}>
                <button
                    type="submit"
                    disabled={pending}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                >
                    {pending ? 'Generating...' : 'Create invite link'}
                </button>
            </form>
            {state.error ? (
                <p className="mt-2 text-sm text-red-600">{state.error}</p>
            ) : null}

            {inviteUrl ? (
                <div className="mt-3 flex items-center gap-2">
                    <input
                        readOnly
                        value={inviteUrl}
                        className="w-full rounded border px-2 py-1 text-sm"
                    />
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
