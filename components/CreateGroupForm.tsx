'use client';

import { useActionState } from 'react';
import { createGroup } from '@/lib/groups/groups';
import { SubmitButton } from '@/components/SubmitButton';
import FormError from '@/components/FormError';
import { ActionResult } from '@/lib/actions/result';

const initialState: ActionResult = { ok: true, data: undefined };

export default function CreateGroupForm() {
    const [state, formAction] = useActionState(createGroup, initialState);

    return (
        <form action={formAction} className="flex max-w-md flex-col gap-4">
            <label className="flex flex-col gap-1">
                <span>Group name</span>
                <input name="name" required maxLength={100} className="rounded border px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
                <span>Description (optional)</span>
                <textarea name="description" rows={3} maxLength={500} className="rounded border px-2 py-1" />
            </label>
            {state.ok ? null : <FormError>{state.error}</FormError>}

            <SubmitButton pendingText="Creating...">Create group</SubmitButton>
        </form>
    );
}
