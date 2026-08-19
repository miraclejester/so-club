'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMembership, AuthorizationError } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { ErrorState } from '@/lib/types';
import { GROUPS_URL } from '@/lib/globals';
import { ScheduleSessionsSchema } from '@/lib/validation';

export async function scheduleWatchSession(backlogItemId: string, formData: FormData): Promise<ErrorState> {
    const backlogItem = await prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { id: true, groupId: true, mediaItemId: true },
    });

    if (!backlogItem) {
        return { error: 'That item is not in any backlog' };
    }

    let userId: string;

    try {
        ({ userId } = await requireMembership(backlogItem.groupId));
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return { error: 'You are not a member of this group' };
        }
        throw e;
    }

    const parsed = ScheduleSessionsSchema.safeParse({
        scheduledFor: formData.get('scheduledFor'),
        location: formData.get('location'),
        notes: formData.get('notes'),
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
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
    } catch {
        return { error: 'Could not schedule the session. Please try again' };
    }

    revalidatePath(`${GROUPS_URL}/${backlogItem.groupId}`);
    redirect(`${GROUPS_URL}/${backlogItem.groupId}/sessions/${createdId}`);
}
