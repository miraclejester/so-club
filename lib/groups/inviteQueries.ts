import { prisma } from '@/lib/prisma';
import { Group, Invite } from '@/prisma/generated/prisma/client';

export type InviteWithDetails = Invite & { group: Group; active: boolean };

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
        where: {
            groupId,
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            AND: [
                {
                    OR: [{ maxUses: null }, { maxUses: { gt: prisma.invite.fields.useCount } }],
                },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });
}

export function isInviteActive(invite: Invite): boolean {
    const revoked: boolean = invite.revokedAt !== null;
    const expired: boolean = invite.expiresAt !== null && invite.expiresAt < new Date();
    const exhausted: boolean = invite.maxUses !== null && invite.useCount >= invite.maxUses;
    return !(revoked || expired || exhausted);
}
