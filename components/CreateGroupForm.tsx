'use client';

import { useActionState } from 'react';
import { createGroup } from '@/lib/groups/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/lib/actions/result';
import { Form } from '@base-ui/react/form';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { Field, FieldControl, FieldError, FieldLabel } from '@/components/ui/field';

const initialState: ActionResult = { ok: true, data: undefined };

export function CreateGroupForm() {
    const [state, formAction] = useActionState(createGroup, initialState);

    return (
        <Form action={formAction} className="flex max-w-md flex-col gap-4">
            <Field name="name">
                <FieldLabel>Group name</FieldLabel>
                <Input required maxLength={100} />
                <FieldError />
            </Field>

            <Field name="description">
                <FieldLabel>Description (optional)</FieldLabel>
                <FieldControl maxLength={500} render={<Textarea rows={3} />} />
                <FieldError />
            </Field>

            {state.ok ? null : <FormError>{state.error}</FormError>}
            <SubmitButton pendingText="Creating...">Create group</SubmitButton>
        </Form>
    );
}
