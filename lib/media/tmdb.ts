import { MediaProvider, NormalizedMediaItem, ProviderError } from '@/lib/media/types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

type TMDBMovie = {
    id: number;
    title: string;
    poster_path: string | null;
    release_date?: string;
    overview?: string;
    vote_average?: number;
    original_language?: string;
};

type TMDBSearchResponse = {
    results: TMDBMovie[];
};

export class TMDBProvider implements MediaProvider {
    readonly source = 'TMDB' as const;

    constructor(private readonly token: string) {
        if (!token) {
            throw new Error('TMDBProvider requires an access token');
        }
    }

    private async get<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
        const url = new URL(`${TMDB_BASE}${path}`);
        for (const [k, v] of Object.entries(params)) {
            url.searchParams.set(k, v);
        }

        let res: Response;
        try {
            res = await fetch(url, {
                headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
                next: { revalidate: 60 * 60 }, // Cache responses for an hour
            });
        } catch (e) {
            throw new ProviderError('network', 'Failed to reach TMDB.', e);
        }

        if (res.status === 404) {
            return null;
        }
        if (res.status === 401) {
            throw new ProviderError('unauthorized', 'TMDB rejected the token');
        }
        if (res.status === 429) {
            throw new ProviderError('rate_limited', 'TMDB rate limit reached');
        }
        if (!res.ok) {
            throw new ProviderError('unknown', `TMDB responded ${res.status}.`);
        }

        return (await res.json()) as T;
    }

    async search(query: string): Promise<NormalizedMediaItem[]> {
        const q = query.trim();
        if (!q) {
            return [];
        }
        const data = await this.get<TMDBSearchResponse>('/search/movie', {
            query: q,
            include_adult: 'false',
        });
        return (data?.results ?? []).map((m) => this.normalize(m));
    }

    async getByExternalId(externalId: string): Promise<NormalizedMediaItem | null> {
        const movie = await this.get<TMDBMovie>(`/movie/${encodeURIComponent(externalId)}`);
        return movie ? this.normalize(movie) : null;
    }

    private normalize(m: TMDBMovie): NormalizedMediaItem {
        return {
            source: 'TMDB',
            externalId: String(m.id),
            type: 'MOVIE',
            title: m.title,
            coverImage: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
            releaseDate: m.release_date ?? null,
            metadata: {
                overview: m.overview ?? null,
                voteAverage: m.vote_average ?? null,
                originalLanguage: m.original_language ?? null,
            },
        };
    }
}
