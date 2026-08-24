'use client';

import { Field as FieldPrimitive } from '@base-ui/react/field';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
    return <FieldPrimitive.Root data-slot="field" className={cn('flex flex-col gap-1', className)} {...props} />;
}

function FieldLabel(props: FieldPrimitive.Label.Props) {
    return <FieldPrimitive.Label render={<Label />} {...props} />;
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
    return <FieldPrimitive.Error className={cn('text-sm text-destructive', className)} {...props} />;
}

function FieldControl(props: FieldPrimitive.Control.Props) {
    return <FieldPrimitive.Control {...props} />;
}

export { Field, FieldLabel, FieldError, FieldControl };
