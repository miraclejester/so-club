'use server';

import { RsvpStatus } from '@/prisma/generated/prisma/enums';
import { ActionResult, fail, logAndFail, ok } from '../actions/result';
import { prisma } from '@/lib/prisma';
import { checkMembership } from '@/lib/authorizationControl';
import { revalidatePath } from 'next/cache';
import { GROUPS_URL } from '@/lib/globals';

const VALID_RSVP_STATUSES = ['GOING', 'MAYBE', 'NOT_GOING'];

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
