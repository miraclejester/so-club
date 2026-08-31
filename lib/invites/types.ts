import {Group, Invite} from '@/prisma/generated/prisma/client';

export type InviteWithDetails = Invite & { group: Group; active: boolean };