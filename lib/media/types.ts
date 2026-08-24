export type MediaSource = 'TMDB'; // More sources later
export type MediaType = 'MOVIE' | 'BOOK' | 'GAME';

export interface NormalizedMediaItem {
    source: MediaSource;
    externalId: string;
    type: MediaType;
    title: string;
    coverImage: string | null;
    releaseDate: string | null;
    metadata: Record<string, unknown>;
}

export interface MediaProvider {
    readonly source: MediaSource;
    search(query: string): Promise<NormalizedMediaItem[]>;
    getByExternalId(externalId: string): Promise<NormalizedMediaItem | null>;
}

export type ProviderErrorKind = 'rate_limited' | 'unauthorized' | 'network' | 'unknown';
export class ProviderError extends Error {
    constructor(
        public readonly kind: ProviderErrorKind,
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'ProviderError';
    }
}
