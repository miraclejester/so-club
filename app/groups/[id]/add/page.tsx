import { JSX } from 'react';
import { AuthorizationError, requireMembership } from '@/lib/authorizationControl';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MovieSearch from '@/components/MovieSearch';
import { addToBacklog } from '@/lib/media/backlog';

type AddMediaPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AddMediaPage({ params }: AddMediaPageProps): Promise<JSX.Element> {
    const { id } = await params;

    await requireMembership(id).catch((e) => {
        if (e instanceof AuthorizationError) {
            notFound();
        }
        throw e;
    });

    return (
        <main className="mx-auto, max-w-2xl p-6">
            <Link href={`/groups/${id}`} className="text-sm text-gray-500 hover:underline">
                Back to group
            </Link>
            <h1 className="mt-2 text-xl font-semibold">Add a movie</h1>
            <div className="mt-4">
                <MovieSearch addAction={addToBacklog.bind(null, id)} />
            </div>
        </main>
    );
}
