import { InviteWithDetails } from '@/lib/groups/invites';
import { prisma } from '@/lib/prisma';
import { Invite } from '@/prisma/generated/prisma/client';

export async function getInvite(token: string): Promise<InviteWithDetails | null> {
    const inviteWithGroup = await prisma.invite.findUnique({
        where: { token },
        include: { group: true },
    });

    if (inviteWithGroup === null) {
        return null;
    }

    return {
        ...inviteWithGroup,
        expired: isInviteExpired(inviteWithGroup),
        exhausted: isInviteExhausted(inviteWithGroup),
    };
}

export function isInviteExpired(invite: Invite): boolean {
    return invite.expiresAt !== null && invite.expiresAt < new Date();
}

export function isInviteExhausted(invite: Invite): boolean {
    return invite.maxUses !== null && invite.useCount >= invite.maxUses;
}
