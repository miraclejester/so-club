'use server';

import { revalidatePath } from 'next/cache';
import { requireMembership, AuthorizationError, roleIsAtLeast } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { snapshotMediaItem } from '@/lib/media/catalog';
import { Prisma, Role } from '@/prisma/generated/prisma/client';
import type { MediaSource } from '@/lib/media';
import { GROUPS_URL } from '@/lib/globals';
import { MediaSourceSchema, TmdbExternalIdSchema } from '@/lib/validation';

export type AddResult = { status: 'added' | 'duplicate' | 'error'; message: string };
export type RemoveResult = { status: 'removed' | 'error'; message?: string };
export type AddAction = (source: MediaSource, externalId: string) => Promise<AddResult>;

export async function addToBacklog(groupId: string, source: MediaSource, externalId: string): Promise<AddResult> {
    // Authorize
    let userId: string;
    try {
        const context = await requireMembership(groupId);
        userId = context.userId;
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return { status: 'error', message: 'You are not a member of this group.' };
        }
        throw e;
    }

    const parsedSource = MediaSourceSchema.safeParse(source);
    const parsedId = TmdbExternalIdSchema.safeParse(externalId);

    if (!parsedSource.success || !parsedId.success) {
        return { status: 'error', message: 'That title could not be added' };
    }

    // Snapshot
    let mediaItem;
    try {
        mediaItem = await snapshotMediaItem(source, externalId);
    } catch {
        return { status: 'error', message: 'Could not fetch that title. Try again later' };
    }

    // Add to Backlog
    try {
        await prisma.backlogItem.create({
            data: { groupId, mediaItemId: mediaItem.id, addedById: userId, status: 'BACKLOG' },
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return { status: 'duplicate', message: 'Already in this backlog' };
        }
        return { status: 'error', message: 'Could not add to the backlog. Try again later' };
    }

    revalidatePath(`/groups/${groupId}`);
    return { status: 'added', message: 'Added to backlog' };
}

export async function removeFromBacklog(backlogItemId: string): Promise<RemoveResult> {
    const item = await prisma.backlogItem.findUnique({
        where: { id: backlogItemId },
        select: { id: true, groupId: true, addedById: true },
    });

    if (!item) {
        return { status: 'removed' };
    }

    let userId: string;
    let role: Role;

    try {
        const auth = await requireMembership(item.groupId);
        userId = auth.userId;
        role = auth.membership.role;
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return { status: 'error', message: 'You are not a member of this group.' };
        }
        throw e;
    }

    const canRemove = item.addedById === userId || roleIsAtLeast(role, 'ADMIN');
    if (!canRemove) {
        return { status: 'error', message: 'Only the person who added this item or an admin can remove it' };
    }

    try {
        await prisma.backlogItem.deleteMany({ where: { id: backlogItemId, groupId: item.groupId } });
    } catch {
        return { status: 'error', message: 'Could not remove the item. Please try again later' };
    }

    revalidatePath(`${GROUPS_URL}/${item.groupId}`);
    return { status: 'removed' };
}
