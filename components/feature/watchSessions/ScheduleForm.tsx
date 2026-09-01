'use client';

import type { ChangeEvent } from 'react';
import { useActionState, useState } from 'react';
import { Input } from '@/components/ui/input';
import { localToUTC } from '@/lib/utils';
import type { ActionResult } from '@/lib/actions/result';
import { ok } from '@/lib/actions/result';
import { FormError } from '@/components/ui/form-error';
import { Form } from '@base-ui/react/form';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/layout/SubmitButton';

const initialState: ActionResult = ok();

type ScheduleFormProps = {
    action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
};

export function ScheduleForm({ action }: ScheduleFormProps) {
    const [state, formAction, pending] = useActionState(action, initialState);
    const [local, setLocal] = useState('');

    const iso = localToUTC(local);

    function handleLocalTimeChange(e: ChangeEvent<HTMLInputElement>) {
        setLocal(e.target.value);
    }

    return (
        <Form action={formAction} className="flex max-w-lg flex-col gap-4">
            <Field>
                <FieldLabel>
                    <span className="text-sm font-medium">When</span>
                    <Input type="datetime-local" value={local} onChange={handleLocalTimeChange} required />
                </FieldLabel>
            </Field>
            <input type="hidden" name="scheduledFor" value={iso} />

            <Field name="location">
                <FieldLabel>
                    <span className="text-sm font-medium">Location or link (optional)</span>
                    <Input name="location" placeholder={"Someone's place or a stream/discord link"} />
                </FieldLabel>
            </Field>

            <Field name="notes">
                <FieldLabel>
                    <span className="text-sm font-medium">Notes (optional)</span>
                    <FieldControl maxLength={1000} render={<Textarea rows={3} />} />
                </FieldLabel>
            </Field>

            {state.ok ? null : <FormError>{state.error}</FormError>}

            <SubmitButton pendingText="Scheduling..." disabled={pending || !iso}>
                Schedule session
            </SubmitButton>
        </Form>
    );
}
