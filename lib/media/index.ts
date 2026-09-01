import type { MediaProvider } from './types';
import type { MediaSource } from '@/prisma/generated/prisma/enums';
import { TMDBProvider } from '@/lib/media/providers/tmdb';
import { env } from '@/lib/env';

let registry: Record<MediaSource, MediaProvider> | null = null;

function build(): Record<MediaSource, MediaProvider> {
    return {
        TMDB: new TMDBProvider(env().TMDB_ACCESS_TOKEN),
    };
}

export function getProvider(source: MediaSource): MediaProvider {
    registry ??= build();
    return registry[source];
}

export * from './types';
