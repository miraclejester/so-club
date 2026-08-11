'use client';

import { useActionState } from 'react';
import { createGroup } from '@/lib/groups';

const initialState = { error: null as string | null };

export default function CreateGroupForm() {
    const [state, formAction, pending] = useActionState(
        createGroup,
        initialState
    );

    return (
        <form action={formAction} className="flex max-w-md flex-col gap-4">
            <label className="flex flex-col gap-1">
                <span>Group name</span>
                <input
                    name="name"
                    required
                    maxLength={100}
                    className="rounded border px-2 py-1"
                />
            </label>
            <label className="flex flex-col gap-1">
                <span>Description (optional)</span>
                <textarea
                    name="description"
                    rows={3}
                    maxLength={500}
                    className="rounded border px-2 py-1"
                />
            </label>
            {state.error ? (
                <p className="text-sm text-red-600">{state.error}</p>
            ) : null}

            <button
                type="submit"
                disabled={pending}
                className="rounded border px-3 py-1 disabled:opacity-50"
            >
                {pending ? 'Creating...' : 'Create group'}
            </button>
        </form>
    );
}
