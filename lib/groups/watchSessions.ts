'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMembership, AuthorizationError } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { ErrorState } from '@/lib/types';
import { GROUPS_URL } from '@/lib/globals';

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

    const iso = (formData.get('scheduledFor') as string) ?? '';
    const when = new Date(iso);
    if (!iso || Number.isNaN(when.getTime())) {
        return { error: `Please choose a valid date and time.` };
    }
    if (when.getTime() < Date.now()) {
        return { error: 'Please pick a time in the future' };
    }

    const location = ((formData.get('location') as string) ?? '').trim() || null;
    const notes = ((formData.get('notes') as string) ?? '').trim() || null;

    let createdId: string = '';
    try {
        const [created] = await prisma.$transaction([
            prisma.watchSession.create({
                data: {
                    scheduledFor: when,
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

    console.log(createdId);
    revalidatePath(`${GROUPS_URL}/${backlogItem.groupId}`);
    redirect(`${GROUPS_URL}/${backlogItem.groupId}/sessions/${createdId}`);
}
