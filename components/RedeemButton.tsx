'use client';

import { ErrorState } from '@/lib/types';
import { JSX, useActionState } from 'react';
import { SubmitButton } from '@/components/SubmitButton';

const initialState: ErrorState = { error: null };

type RedeemButtonProps = {
    action: (prev: ErrorState, formData: FormData) => Promise<ErrorState>;
};

export function RedeemButton({ action }: RedeemButtonProps): JSX.Element {
    const [state, formAction] = useActionState(action, initialState);

    return (
        <form action={formAction}>
            <SubmitButton pendingText="Joining..."> Join group </SubmitButton>
            {state.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
        </form>
    );
}
