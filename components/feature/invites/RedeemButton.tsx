'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/layout/SubmitButton';
import type { ActionResult, FormAction } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import { ActionError } from '@/components/layout/ActionError';

const initialState: ActionResult = ok();

type RedeemButtonProps = {
    action: FormAction;
};

export function RedeemButton({ action }: RedeemButtonProps) {
    const [state, formAction] = useActionState(action, initialState);

    return (
        <form action={formAction}>
            <SubmitButton pendingText="Joining...">Join group</SubmitButton>
            <ActionError result={state} />
        </form>
    );
}
