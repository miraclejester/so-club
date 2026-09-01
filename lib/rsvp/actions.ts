'use server';

import type { RsvpStatus } from '@/prisma/generated/prisma/enums';
import type { ActionResult } from '../actions/result';
import { fail, logAndFail, ok } from '../actions/result';
import { prisma } from '@/lib/prisma';
import { checkMembership } from '@/lib/authorizationControl';
import { revalidatePath } from 'next/cache';
import { GROUPS_URL } from '@/lib/globals';
import { RsvpStatusSchema } from '@/lib/validation';

export async function setRsvp(sessionId: string, status: RsvpStatus): Promise<ActionResult> {
    const parsed = RsvpStatusSchema.safeParse(status);
    if (!parsed.success) {
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
            update: { status: parsed.data },
            create: { watchSessionId: sessionId, userId, status: parsed.data },
        });
    } catch (e) {
        return logAndFail('setRsvp', e, 'Could not save your response. Try again later');
    }

    revalidatePath(`${GROUPS_URL}/${session.groupId}/sessions/${sessionId}`);
    return ok();
}
