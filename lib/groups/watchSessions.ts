'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkMembership } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { GROUPS_URL } from '@/lib/globals';
import { ScheduleSessionsSchema } from '@/lib/validation';
import type { ActionResult } from '@/lib/actions/result';
import { fail, logAndFail } from '@/lib/actions/result';

export async function scheduleWatchSession(backlogItemId: string, formData: FormData): Promise<ActionResult> {
    const backlogItem = await prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { id: true, groupId: true, mediaItemId: true },
    });

    if (!backlogItem) {
        return fail('That item is not in any backlog');
    }

    const check = await checkMembership(backlogItem.groupId);
    if (!check.ok) {
        return fail(check.error);
    }
    const userId = check.userId;

    const parsed = ScheduleSessionsSchema.safeParse({
        scheduledFor: formData.get('scheduledFor'),
        location: formData.get('location'),
        notes: formData.get('notes'),
    });

    if (!parsed.success) {
        return fail(parsed.error.issues[0].message);
    }
    const { scheduledFor, location, notes } = parsed.data;

    let createdId: string = '';
    try {
        const [created] = await prisma.$transaction([
            prisma.watchSession.create({
                data: {
                    scheduledFor,
                    location,
                    notes,
                    groupId: backlogItem.groupId,
                    mediaItemId: backlogItem.mediaItemId,
                    createdById: userId,
                },
            }),
            prisma.backlogItem.update({
                where: { id: backlogItem.id },
                data: { status: 'SCHEDULED' },
            }),
        ]);
        createdId = created.id;
    } catch (e) {
        return logAndFail('scheduleWatchSession', e, 'Could not schedule the session. Please try again');
    }

    revalidatePath(`${GROUPS_URL}/${backlogItem.groupId}`);
    redirect(`${GROUPS_URL}/${backlogItem.groupId}/sessions/${createdId}`);
}
