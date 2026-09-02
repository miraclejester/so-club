'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { loadGroupResource } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { groupPath, sessionPath } from '@/lib/globals';
import { ScheduleSessionsSchema } from '@/lib/validation';
import type { ActionResult } from '@/lib/actions/result';
import { fail, logAndFail } from '@/lib/actions/result';

export async function scheduleWatchSession(backlogItemId: string, formData: FormData): Promise<ActionResult> {
    const loaded = await loadGroupResource(
        () =>
            prisma.backlogItem.findUnique({
                where: { id: backlogItemId },
                select: { id: true, groupId: true, mediaItemId: true, status: true },
            }),
        'That item is not in any backlog'
    );

    if (!loaded.ok) {
        return loaded;
    }

    const { resource: backlogItem, userId } = loaded.data;

    if (backlogItem.status === 'SCHEDULED') {
        return fail('That item has already been scheduled');
    }

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
                    backlogItemId: backlogItem.id,
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

    revalidatePath(groupPath(backlogItem.groupId));
    redirect(sessionPath(backlogItem.groupId, createdId));
}
