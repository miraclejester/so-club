'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/layout/SubmitButton';
import type { ActionResult } from '@/lib/actions/result';
import { FormError } from '@/components/ui/form-error';

const initialState: ActionResult = { ok: true, data: undefined };

type RedeemButtonProps = {
    action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
};

export function RedeemButton({ action }: RedeemButtonProps) {
    const [state, formAction] = useActionState(action, initialState);

    return (
        <form action={formAction}>
            <SubmitButton pendingText="Joining...">Join group</SubmitButton>
            {state.ok ? null : <FormError>{state.error}</FormError>}
        </form>
    );
}
