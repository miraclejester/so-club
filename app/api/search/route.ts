import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProvider, type NormalizedMediaItem, ProviderError } from '@/lib/media';
import { SearchQuerySchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';

type SearchResponseBody = { error: string } | NormalizedMediaItem[];

export async function GET(req: NextRequest): Promise<NextResponse<SearchResponseBody>> {
    const user = await getCurrentUser();
    if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rateLimit(`search:${user.id}`, 30, 60000)) {
        return NextResponse.json({ error: 'Too many searches. Please slow down' }, { status: 429 });
    }

    const parsed = SearchQuerySchema.safeParse(req.nextUrl.searchParams.get('q') ?? '');

    // Search is too short
    if (!parsed.success) {
        return NextResponse.json([]);
    }

    try {
        const results = await getProvider('TMDB').search(parsed.data);
        return NextResponse.json(results);
    } catch (e) {
        if (e instanceof ProviderError && e.kind === 'rate_limited') {
            return NextResponse.json({ error: 'Rate limited - try again shortly.' }, { status: 429 });
        }
        console.error('search failed: ', e);
        return NextResponse.json({ error: 'Search failed' }, { status: 502 });
    }
}
