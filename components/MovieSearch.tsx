'use client';

import { JSX, useEffect, useState } from 'react';
import { NormalizedMediaItem } from '@/lib/media';
import type { AddAction } from '@/lib/media/backlog';
import AddToBacklogButton from '@/components/AddToBacklogButton';
import Image from 'next/image';

type Status = 'idle' | 'loading' | 'done' | 'error';

type MovieSearchProps = {
    addAction: AddAction;
};

export default function MovieSearch({ addAction }: MovieSearchProps): JSX.Element {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NormalizedMediaItem[]>([]);
    const [status, setStatus] = useState<Status>('idle');

    function handleChange(value: string): void {
        setQuery(value);
        setStatus(value.trim().length < 2 ? 'idle' : 'loading');
    }

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
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
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <div>
            <input
                type="search"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search movies..."
                className="w-full rounded border px-3 py-2"
            />
            <div className="mt-4">
                {status === 'loading' ? <p className="text-sm text-gray-500">Searching...</p> : null}
                {status === 'error' ? <p className="text-sm text-red-600">Something went wrong. Try again.</p> : null}
                {status === 'done' && results.length === 0 ? (
                    <p className="text-sm text-gray-500">No movies found for "{`${query.trim()}`}".</p>
                ) : null}
                {status !== 'idle' && results.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {results.map((m) => (
                            <ResultsCard key={`${m.source}-${m.externalId}`} item={m} addAction={addAction} />
                        ))}
                    </ul>
                ) : null}
            </div>
        </div>
    );
}

type ResultsCardProps = {
    item: NormalizedMediaItem;
    addAction: AddAction;
};

function ResultsCard({ item, addAction }: ResultsCardProps): JSX.Element {
    const year = item.releaseDate?.slice(0, 4) ?? '--';
    return (
        <li className="rounded border p-2">
            <div className="relative aspect-2/3 w-full overflow-hidden rounded bg-gray-100">
                {item.coverImage ? (
                    <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="150px" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">No poster</div>
                )}
            </div>
            <p className="mt-1 truncate text-sm font-medium" title={item.title}>
                {item.title}
            </p>
            <p className="text-xs text-gray-500">{year}</p>
            <AddToBacklogButton source={item.source} externalId={item.externalId} action={addAction} />
        </li>
    );
}
