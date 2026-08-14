import { describe, it, expect, vi } from 'vitest';
import { TMDBProvider } from '@/lib/media/tmdb';

const sample = {
    results: [
        {
            id: 413413,
            title: 'VIZARD',
            poster_path: '/abc.jpg',
            release_date: '2026-07-15',
            overview: 'A hacker who steals corporate secrets...',
            vote_average: 8.4,
            original_language: 'en',
        },
    ],
};

const mockFetch = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response);

const provider = new TMDBProvider('test-token');

describe('TMDB provider', () => {
    it('properly normalizes a TMDB movie', async () => {
        vi.stubGlobal('fetch', mockFetch(200, sample));
        const [item] = await provider.search('VIZARD');
        expect(item).toEqual({
            source: 'TMDB',
            externalId: '413413',
            type: 'MOVIE',
            title: 'VIZARD',
            coverImage: 'https://image.tmdb.org/t/p/w500/abc.jpg',
            releaseDate: '2026-07-15',
            metadata: {
                overview: 'A hacker who steals corporate secrets...',
                voteAverage: 8.4,
                originalLanguage: 'en',
            },
        });
    });

    it('sends the bearer token', async () => {
        const f = mockFetch(200, sample);
        vi.stubGlobal('fetch', f);
        await provider.search('V');
        const opts = f.mock.calls[0][1] as RequestInit;
        expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    });

    it('maps a null poster to a null cover', async () => {
        vi.stubGlobal('fetch', mockFetch(200, { results: [{ ...sample.results[0], poster_path: null }] }));
        const [item] = await provider.search('V');
        expect(item.coverImage).toBeNull();
    });

    it('returns null for a missing movie', async () => {
        vi.stubGlobal('fetch', mockFetch(404, {}));
        expect(await provider.getByExternalId('0')).toBeNull();
    });
});
