import type { RsvpOption } from '@/lib/rsvp/types';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';

export const RSVP_OPTIONS: RsvpOption[] = [
    { value: 'GOING', label: 'Going' },
    { value: 'MAYBE', label: 'Maybe' },
    { value: 'NOT_GOING', label: 'Not Going' },
];

export const RSVP_LABEL: Record<RsvpStatus, string> = {
    GOING: 'Going',
    MAYBE: 'Maybe',
    NOT_GOING: 'Not Going',
};
