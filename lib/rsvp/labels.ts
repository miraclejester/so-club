import type { RsvpOption } from '@/lib/rsvp/types';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';

export const RSVP_LABEL: Record<RsvpStatus, string> = {
    GOING: 'Going',
    MAYBE: 'Maybe',
    NOT_GOING: 'Not Going',
};

export const RSVP_OPTIONS: RsvpOption[] = (Object.keys(RSVP_LABEL) as RsvpStatus[]).map((value) => ({
    value,
    label: RSVP_LABEL[value],
}));
