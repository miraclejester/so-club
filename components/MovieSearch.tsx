'use client';

import { useEffect, useState } from 'react';
import type { NormalizedMediaItem } from '@/lib/media';
import type { AddAction } from '@/lib/media/backlog/actions';
import { AddToBacklogButton } from '@/components/AddToBacklogButton';
import { FormError } from '@/components/ui/form-error';
import { MediaCard } from '@/components/MediaCard';
import { Input } from '@/components/ui/input';
import { formatYear } from '@/lib/utils';

type Status = 'idle' | 'loading' | 'done' | 'error';

type MovieSearchProps = {
    addAction: AddAction;
    existingKeys: string[];
};

export function MovieSearch({ addAction, existingKeys }: MovieSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NormalizedMediaItem[]>([]);
    const [status, setStatus] = useState<Status>('idle');

    const existing = new Set(existingKeys);

    function handleChange(value: string): void {
        setQuery(value);
        setStatus(value.trim().length < 2 ? 'idle' : 'loading');
    }

    async function searchTimerFunc(controller: AbortController, q: string): Promise<void> {
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            });
            if (!res.ok) {
                setStatus('error');
                return;
            }
            setResults((await res.json()) as NormalizedMediaItem[]);
            setStatus('done');
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setStatus('error');
            }
        }
    }

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
            void searchTimerFunc(controller, q);
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <div>
            <Input
                type="search"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search movies..."
                className="w-full rounded border px-3 py-2"
            />
            <div className="mt-4">
                {status === 'loading' ? <p className="text-sm text-gray-500">Searching...</p> : null}
                {status === 'error' ? <FormError>Something went wrong. Try again.</FormError> : null}
                {status === 'done' && results.length === 0 ? (
                    <p className="text-sm text-gray-500">No movies found for &quot;{`${query.trim()}`}&quot;.</p>
                ) : null}
                {status !== 'idle' && results.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {results.map((m) => (
                            <MediaCard
                                key={`${m.source}-${m.externalId}`}
                                title={m.title}
                                coverImage={m.coverImage}
                                year={formatYear(m.releaseDate)}
                            >
                                <AddToBacklogButton
                                    source={m.source}
                                    externalId={m.externalId}
                                    action={addAction}
                                    alreadyInBacklog={existing.has(`${m.source}:${m.externalId}`)}
                                />
                            </MediaCard>
                        ))}
                    </ul>
                ) : null}
            </div>
        </div>
    );
}
