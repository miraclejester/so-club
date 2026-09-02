'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import type { ActionResult, FormAction } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import { ActionError } from '@/components/ui/action-error';

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
