import type { MediaProvider, MediaSource } from './types';
import { TMDBProvider } from '@/lib/media/tmdb';

let registry: Record<MediaSource, MediaProvider> | null = null;

function build(): Record<MediaSource, MediaProvider> {
    return {
        TMDB: new TMDBProvider(process.env.TMDB_ACCESS_TOKEN ?? ''),
    };
}

export function getProvider(source: MediaSource): MediaProvider {
    registry ??= build();
    return registry[source];
}

export * from './types';
