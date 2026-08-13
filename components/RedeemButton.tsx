'use client';

import { ErrorState } from '@/lib/types';
import { JSX, useActionState } from 'react';

const initialState: ErrorState = { error: null };

type RedeemButtonProps = {
    action: (prev: ErrorState, formData: FormData) => Promise<ErrorState>;
};

export function RedeemButton({ action }: RedeemButtonProps): JSX.Element {
    const [state, formAction, pending] = useActionState(action, initialState);

    return (
        <form action={formAction}>
            <button type="submit" disabled={pending} className="rounded border px-3 py-1 disabled:opacity-50">
                {pending ? 'Joining...' : 'Join group'}
            </button>
            {state.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        </form>
    );
}
