'use server';

import { checkMembership, loadGroupResource } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Prisma } from '@/prisma/generated/prisma/client';
import { GROUPS_URL } from '@/lib/globals';
import type { ActionResult } from '@/lib/actions/result';
import { ok, fail, logAndFail } from '@/lib/actions/result';
import { randomBytes } from 'node:crypto';

import {
    getActiveInviteWhereClauseByGroup,
    getActiveInviteWhereClauseByToken,
    isInviteActive,
} from '@/lib/invites/queries';

class InviteUnavailableError extends Error {}

const INVITE_TTL_DAYS = 7;

function newInviteToken(): string {
    return randomBytes(32).toString('base64url');
}

export async function createInvite(groupId: string): Promise<ActionResult> {
    const check = await checkMembership(groupId, 'ADMIN');
    if (!check.ok) {
        return fail(check.error);
    }
    const userId = check.userId;
    const expiryDate = new Date();
    expiryDate.setUTCDate(expiryDate.getUTCDate() + INVITE_TTL_DAYS);

    try {
        await prisma.$transaction([
            prisma.invite.updateMany({
                data: {
                    revokedAt: new Date(),
                },
                where: getActiveInviteWhereClauseByGroup(groupId),
            }),
            prisma.invite.create({
                data: {
                    groupId,
                    createdById: userId,
                    expiresAt: expiryDate,
                    token: newInviteToken(),
                },
            }),
        ]);

        revalidatePath(`${GROUPS_URL}/${groupId}`);
        return ok();
    } catch (e) {
        return logAndFail('createInvite', e, 'Could not create invite. Please try again later');
    }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
    const loaded = await loadGroupResource(
        () =>
            prisma.invite.findUnique({
                where: { id: inviteId },
            }),
        'Invite not found'
    );

    if (!loaded.ok) {
        return loaded;
    }

    const { resource: invite } = loaded.data;

    try {
        await prisma.invite.update({
            data: { revokedAt: new Date() },
            where: { id: invite.id },
        });
    } catch (e) {
        return logAndFail('revokeInvite', e, 'Could not revoke invite');
    }

    revalidatePath(`${GROUPS_URL}/${invite.groupId}`);

    return ok();
}

export async function redeemInvite(token: string): Promise<ActionResult> {
    const { id } = await requireUser(`/invite/${token}`);

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
        return fail('This invite link is invalid');
    }

    if (!isInviteActive(invite)) {
        return fail('This invite link is no longer active');
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
        await prisma.$transaction(async (tx) => {
            const { count } = await tx.invite.updateMany({
                where: getActiveInviteWhereClauseByToken(token),
                data: { useCount: { increment: 1 } },
            });
            if (count === 0) {
                throw new InviteUnavailableError();
            }

            await tx.membership.create({
                data: { userId: id, groupId: invite.groupId, role: 'MEMBER' },
            });
        });
    } catch (e) {
        if (e instanceof InviteUnavailableError) {
            return fail('This invite link is no longer active');
        }
        // Invite redemption was not unique. Probably joined concurrently with a different invite to the same group
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            redirect(groupUrl);
        }
        return logAndFail('redeemInvite', e, 'Could not join the group. Please try again later');
    }

    revalidatePath(GROUPS_URL);
    redirect(groupUrl);
}
