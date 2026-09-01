import type { RsvpOption } from '@/lib/rsvp/types';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';
import { RsvpStatusSchema } from '@/lib/validation';

export const RSVP_LABEL: Record<RsvpStatus, string> = {
    GOING: 'Going',
    MAYBE: 'Maybe',
    NOT_GOING: 'Not Going',
};

export function getRsvpOptions(): RsvpOption[] {
    return Object.entries(RSVP_LABEL).map(([value, label]) => {
        const parsed = RsvpStatusSchema.safeParse(value);
        if (!parsed.success) {
            console.error('Error parsing rsvp label into options');
            throw new Error();
        }

        return { value: parsed.data, label };
    });
}
