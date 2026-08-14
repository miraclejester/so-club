'use server';

import { revalidatePath } from 'next/cache';
import { requireMembership, AuthorizationError } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { snapshotMediaItem } from '@/lib/media/catalog';
import { Prisma } from '@/prisma/generated/prisma/client';
import type { MediaSource } from '@/lib/media';

export type AddResult = { status: 'added' | 'duplicate' | 'error'; message: string };
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
