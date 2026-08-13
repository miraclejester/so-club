'use client';

import { useActionState } from 'react';
import { createGroup } from '@/lib/groups/groups';
import { SubmitButton } from '@/components/SubmitButton';

const initialState = { error: null as string | null };

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
            {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

            <SubmitButton pendingText="Creating...">Create group</SubmitButton>
        </form>
    );
}
