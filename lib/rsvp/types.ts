import type { RsvpStatus } from '@/prisma/generated/prisma/enums';

export type RsvpOption = {
    value: RsvpStatus;
    label: string;
};