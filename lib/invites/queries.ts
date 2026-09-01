import { prisma } from '@/lib/prisma';
import type { Invite } from '@/prisma/generated/prisma/client';
import type { InviteWithDetails } from '@/lib/invites/types';

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
        active: isInviteActive(inviteWithGroup),
    };
}

export async function getActiveInvites(groupId: string): Promise<Invite[]> {
    return prisma.invite.findMany({
        where: getActiveInviteWhereClauseByGroup(groupId),
        orderBy: { createdAt: 'desc' },
    });
}

export function isInviteActive(invite: Invite): boolean {
    const revoked: boolean = invite.revokedAt !== null;
    const expired: boolean = invite.expiresAt !== null && invite.expiresAt < new Date();
    const exhausted: boolean = invite.maxUses !== null && invite.useCount >= invite.maxUses;
    return !(revoked || expired || exhausted);
}

function getActiveInviteWhereClause() {
    return {
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        AND: [
            {
                OR: [{ maxUses: null }, { maxUses: { gt: prisma.invite.fields.useCount } }],
            },
        ],
    };
}

export function getActiveInviteWhereClauseByGroup(groupId: string) {
    return {
        groupId,
        ...getActiveInviteWhereClause(),
    };
}

export function getActiveInviteWhereClauseByToken(token: string) {
    return {
        token,
        ...getActiveInviteWhereClause(),
    };
}
