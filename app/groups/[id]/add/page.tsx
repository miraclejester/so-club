import { JSX } from 'react';
import { requireMembershipOrNotFound } from '@/lib/authorizationControl';
import Link from 'next/link';
import MovieSearch from '@/components/MovieSearch';
import { addToBacklog } from '@/lib/media/backlog';
import { prisma } from '@/lib/prisma';

type AddMediaPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AddMediaPage({ params }: AddMediaPageProps): Promise<JSX.Element> {
    const { id } = await params;
    await requireMembershipOrNotFound(id);

    const backlog = await prisma.backlogItem.findMany({
        where: { groupId: id },
        select: { mediaItem: { select: { source: true, externalId: true } } },
    });

    const existingKeys = new Set(backlog.map((b) => `${b.mediaItem.source}:${b.mediaItem.externalId}`));

    return (
        <>
            <Link href={`/groups/${id}`} className="text-sm text-gray-500 hover:underline">
                Back to group
            </Link>
            <h1 className="mt-2 text-xl font-semibold">Add a movie</h1>
            <div className="mt-4">
                <MovieSearch addAction={addToBacklog.bind(null, id)} existingKeys={[...existingKeys]} />
            </div>
        </>
    );
}
