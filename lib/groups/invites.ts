'use server';

import { checkMembership } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Invite, Group, RsvpStatus } from '@/prisma/generated/prisma/client';
import { GROUPS_URL } from '@/lib/globals';
import { isInviteExhausted, isInviteExpired } from '@/lib/groups/inviteQueries';
import { ActionResult, ok, fail, logAndFail } from '@/lib/actions/result';

const VALID_RSVP_STATUSES = ['GOING', 'MAYBE', 'NOT_GOING'];

type CreateInviteState = ActionResult<{ token: string | null }>;
export type InviteWithDetails = Invite & { group: Group; expired: boolean; exhausted: boolean };

export async function createInvite(groupId: string): Promise<CreateInviteState> {
    const check = await checkMembership(groupId, 'ADMIN');
    if (!check.ok) {
        return fail(check.error);
    }
    const userId = check.userId;

    try {
        const invite = await prisma.invite.upsert({
            where: { groupId },
            update: {},
            create: { groupId, createdById: userId },
        });

        revalidatePath(`${GROUPS_URL}/${groupId}`);
        return ok({ token: invite.token });
    } catch (e) {
        return logAndFail('createInvite', e, 'Could not create invite. Please try again later');
    }
}

export async function redeemInvite(token: string): Promise<ActionResult> {
    const { id } = await requireUser(`/invite/${token}`);

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
        return fail('This invite link is invalid');
    }

    if (isInviteExpired(invite)) {
        return fail('This invite link has expired');
    }

    if (isInviteExhausted(invite)) {
        fail('This invite link has reached its usage limit');
    }

    const groupUrl = `${GROUPS_URL}/${invite.groupId}`;

    // Already a member of the group
    const existing = await prisma.membership.findUnique({
        where: { userId_groupId: { userId: id, groupId: invite.groupId } },
    });
    if (existing) {
        redirect(groupUrl);
    }

    try {
        await prisma.$transaction([
            prisma.membership.create({
                data: { userId: id, groupId: invite.groupId, role: 'MEMBER' },
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
        return logAndFail('redeemInvite', e, 'Could not join the group. Please try again later');
    }

    revalidatePath(GROUPS_URL);
    redirect(groupUrl);
}

export async function setRsvp(sessionId: string, status: RsvpStatus): Promise<ActionResult> {
    if (!VALID_RSVP_STATUSES.includes(status)) {
        return fail('Invalid rsvp status');
    }

    const session = await prisma.watchSession.findUnique({
        where: { id: sessionId },
        select: { id: true, groupId: true },
    });
    if (!session) {
        return fail('That session no longer exists');
    }

    const check = await checkMembership(session.groupId);
    if (!check.ok) {
        return fail(check.error);
    }
    const userId = check.userId;

    try {
        await prisma.rsvp.upsert({
            where: { watchSessionId_userId: { watchSessionId: sessionId, userId } },
            update: { status },
            create: { watchSessionId: sessionId, userId, status },
        });
    } catch (e) {
        return logAndFail('setRsvp', e, 'Could not save your response. Try again later');
    }

    revalidatePath(`${GROUPS_URL}/${session.groupId}/sessions/${sessionId}`);
    return ok();
}
