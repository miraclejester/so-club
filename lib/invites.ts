'use server';

import { AuthorizationError, requireMembership } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ErrorState } from '@/lib/types';
import { getCurrentUser, type LoggedInUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Invite, Group } from '@/prisma/generated/prisma/client';

type CreateInviteState = ErrorState & { token: string | null };
export type InviteWithDetails = Invite & { group: Group; expired: boolean; exhausted: boolean };

export async function createInvite(groupId: string): Promise<CreateInviteState> {
    let userId;
    try {
        const context = await requireMembership(groupId, 'ADMIN');
        userId = context.userId;
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return {
                token: null,
                error: 'Only group admins can create invites',
            };
        }
        throw e;
    }

    try {
        const invite = await prisma.invite.upsert({
            where: { groupId },
            update: {},
            create: { groupId, createdById: userId },
        });

        revalidatePath(`/groups/${groupId}/`);
        return { token: invite.token, error: null };
    } catch (e) {
        console.error(e);
        return {
            token: null,
            error: 'Could not create invite. Please try again later',
        };
    }
}

export async function redeemInvite(token: string): Promise<ErrorState> {
    const user: LoggedInUser | null = await getCurrentUser();
    if (!user?.id) {
        redirect(`api/auth/signin?callbackUrl=/invite/${token}`);
    }
    const userId = user.id;

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
        return { error: 'This invite link is invalid' };
    }

    if (isInviteExpired(invite)) {
        return { error: 'This invite link has expired' };
    }

    if (isInviteExhausted(invite)) {
        return { error: 'This invite link has reached its usage limit' };
    }

    const groupUrl = `/groups/${invite.groupId}`;

    // Already a member of the group
    const existing = await prisma.membership.findUnique({
        where: { userId_groupId: { userId, groupId: invite.groupId } },
    });
    if (existing) {
        redirect(groupUrl);
    }

    try {
        await prisma.$transaction([
            prisma.membership.create({
                data: { userId, groupId: invite.groupId, role: 'MEMBER' },
            }),
            prisma.invite.update({
                where: { token },
                data: { useCount: { increment: 1 } },
            }),
        ]);
    } catch (e) {
        // Invite redemption was not unique. Probably joined concurrently with a different invite to the same group
        if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2002') {
            redirect(groupUrl);
        }
        console.error(e);
        return { error: 'Could not join the group. Please try again later' };
    }

    redirect(groupUrl);
}

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

function isInviteExpired(invite: Invite): boolean {
    return invite.expiresAt !== null && invite.expiresAt < new Date();
}

function isInviteExhausted(invite: Invite): boolean {
    return invite.maxUses !== null && invite.useCount >= invite.maxUses;
}
