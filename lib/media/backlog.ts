'use server';

import { revalidatePath } from 'next/cache';
import { roleIsAtLeast, checkMembership } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { snapshotMediaItem } from '@/lib/media/catalog';
import { Prisma } from '@/prisma/generated/prisma/client';
import type { MediaSource } from '@/lib/media';
import { GROUPS_URL } from '@/lib/globals';
import { MediaSourceSchema, TmdbExternalIdSchema } from '@/lib/validation';
import type { ActionResult } from '@/lib/actions/result';
import { ok, fail, logAndFail } from '@/lib/actions/result';

export type AddResult = ActionResult<{ added: boolean }>;
export type AddAction = (source: MediaSource, externalId: string) => Promise<AddResult>;

export async function addToBacklog(groupId: string, source: MediaSource, externalId: string): Promise<AddResult> {
    // Authorize
    const check = await checkMembership(groupId);
    if (!check.ok) {
        return fail(check.error);
    }
    const userId: string = check.userId;

    const parsedSource = MediaSourceSchema.safeParse(source);
    const parsedId = TmdbExternalIdSchema.safeParse(externalId);

    if (!parsedSource.success || !parsedId.success) {
        return fail('That title could not be added');
    }

    // Snapshot
    let mediaItem;
    try {
        mediaItem = await snapshotMediaItem(source, externalId);
    } catch (e) {
        return logAndFail('addToBacklog', e, 'Could not fetch that title. Try again later');
    }

    // Add to Backlog
    try {
        await prisma.backlogItem.create({
            data: { groupId, mediaItemId: mediaItem.id, addedById: userId, status: 'BACKLOG' },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return ok({ added: false });
        }
        return logAndFail('addToBacklog', e, 'Could not add to the backlog. Try again later');
    }

    revalidatePath(`${GROUPS_URL}/${groupId}`);
    return ok({ added: true });
}

export async function removeFromBacklog(backlogItemId: string): Promise<ActionResult> {
    const item = await prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { id: true, groupId: true, addedById: true },
    });

    if (!item) {
        return ok();
    }

    const check = await checkMembership(item.groupId);
    if (!check.ok) {
        return fail(check.error);
    }
    const {
        userId,
        membership: { role },
    } = check;

    const canRemove = item.addedById === userId || roleIsAtLeast(role, 'ADMIN');
    if (!canRemove) {
        return fail('Only the person who added this item or an admin can remove it');
    }

    try {
        await prisma.backlogItem.deleteMany({ where: { id: backlogItemId, groupId: item.groupId } });
    } catch (e) {
        return logAndFail('removeFromBacklog', e, 'Could not remove the item. Please try again later');
    }

    revalidatePath(`${GROUPS_URL}/${item.groupId}`);
    return ok();
}
