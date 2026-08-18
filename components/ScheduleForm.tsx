'use client';

import { ChangeEvent, JSX, useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localToUTC } from '@/lib/utils';
import { ErrorState } from '@/lib/types';

const initialState: ErrorState = { error: null };

type ScheduleFormProps = {
    action: (prev: ErrorState, formData: FormData) => Promise<ErrorState>;
};

export default function ScheduleForm({ action }: ScheduleFormProps): JSX.Element {
    const [state, formAction, pending] = useActionState(action, initialState);
    const [local, setLocal] = useState('');

    const iso = localToUTC(local);

    function handleLocalTimeChange(e: ChangeEvent<HTMLInputElement>) {
        setLocal(e.target.value);
    }

    return (
        <form action={formAction} className="flex max-w-md flex-col gap-4">
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">When</span>
                <Input type="datetime-local" value={local} onChange={handleLocalTimeChange} required />
            </label>
            <input type="hidden" name="scheduledFor" value={iso} />

            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Location or link (optional)</span>
                <Input name="location" placeholder={"Someone's place or a stream/discord link"} />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Notes (optional)</span>
                <textarea name="notes" rows={3} maxLength={1000} className="rounded-md border px-3 py-2 text-sm" />
            </label>

            {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

            <Button type="submit" disabled={pending || !iso}>
                {pending ? 'Scheduling...' : 'Schedule session'}
            </Button>
        </form>
    );
}
