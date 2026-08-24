import { prisma } from '@/lib/prisma';
import { Prisma, type MediaItem } from '@/prisma/generated/prisma/client';
import type { MediaSource } from './types';
import { getProvider } from '@/lib/media/index';

export async function snapshotMediaItem(source: MediaSource, externalId: string): Promise<MediaItem> {
    const existing = await prisma.mediaItem.findUnique({
        where: { source_externalId: { source, externalId } },
    });

    if (existing) {
        return existing;
    }

    const normalized = await getProvider(source).getByExternalId(externalId);
    if (!normalized) {
        throw new Error(`Media item not found: ${source}: ${externalId}`);
    }

    try {
        return await prisma.mediaItem.create({
            data: {
                source: normalized.source,
                externalId: normalized.externalId,
                type: normalized.type,
                title: normalized.title,
                coverImage: normalized.coverImage,
                releaseDate: normalized.releaseDate ? new Date(normalized.releaseDate) : null,
                metadata: normalized.metadata as Prisma.InputJsonValue,
            },
        });
    } catch (e) {
        // Taking care of race conditions when the same item is saved multiple times in quick succession
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return prisma.mediaItem.findUniqueOrThrow({
                where: { source_externalId: { source, externalId } },
            });
        }
        throw e;
    }
}
