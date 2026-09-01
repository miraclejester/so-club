import type { ActionResult } from '@/lib/actions/result';
import { FormError } from '@/components/ui/form-error';

type ActionErrorProps = {
    result: ActionResult<unknown>;
    className?: string;
};

export function ActionError({ result, className }: ActionErrorProps) {
    return result.ok ? null : <FormError className={className}>{result.error}</FormError>;
}
