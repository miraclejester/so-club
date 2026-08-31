import { describe, it, expect, vi } from 'vitest';

const { findUnique, create } = vi.hoisted(() => ({
    findUnique: vi.fn(),
    create: vi.fn<(args: Prisma.MediaItemCreateArgs) => Promise<MediaItem>>(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: { mediaItem: { findUnique, create, findUniqueOrThrow: vi.fn() } },
}));

vi.mock('@/lib/media/index', () => ({ getProvider: vi.fn() }));

import { getProvider, type MediaProvider, type NormalizedMediaItem } from '@/lib/media';
import { snapshotMediaItem } from '@/lib/media/catalog/actions';
import type { MediaItem, Prisma } from '@/prisma/generated/prisma/client';

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
    return {
        id: 'm0',
        source: 'TMDB',
        externalId: '27205',
        type: 'MOVIE',
        title: 'Inception',
        coverImage: null,
        releaseDate: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

function makeProvider(result: NormalizedMediaItem | null): MediaProvider {
    return {
        source: 'TMDB',
        search: vi.fn(),
        getByExternalId: vi.fn().mockResolvedValue(result),
    };
}

const normalized = {
    source: 'TMDB' as const,
    externalId: '413413',
    type: 'MOVIE' as const,
    title: 'VIZARD',
    coverImage: 'https://image.tmdb.org/t/p/w500/a.jpg',
    releaseDate: '2026-07-15',
    metadata: { voteAverage: 8.4 },
};

describe('snapshotMediaItem', () => {
    it('reuses an existing item if it exists', async () => {
        findUnique.mockResolvedValue(makeMediaItem({ id: 'm1' }));
        const provider = {
            ...makeProvider(null),
            getByExternalId: vi.fn(),
        };
        vi.mocked(getProvider).mockReturnValue(provider);

        const result = await snapshotMediaItem('TMDB', '413413');

        expect(result).toMatchObject({ id: 'm1' });
        expect(provider.getByExternalId).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
    });

    it('fetches and creates on first encounter', async () => {
        findUnique.mockResolvedValue(null);
        vi.mocked(getProvider).mockReturnValue(makeProvider(normalized));
        create.mockResolvedValue(makeMediaItem({ id: 'm2' }));

        await snapshotMediaItem('TMDB', '413413');

        const arg = create.mock.calls[0][0];
        expect(arg.data.releaseDate).toBeInstanceOf(Date);
        expect(create).toHaveBeenCalledOnce();
    });
});
