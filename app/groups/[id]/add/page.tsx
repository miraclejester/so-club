import { requireMembershipOrNotFound } from '@/lib/authorizationControl';
import { MovieSearch } from '@/components/media/MovieSearch';
import { addToBacklog } from '@/lib/media/backlog/actions';
import { prisma } from '@/lib/prisma';
import { Backlink } from '@/components/ui/backlink';
import { groupPath } from '@/lib/paths';
import { PageHeading } from '@/components/ui/page-heading';

export default async function AddMediaPage({ params }: PageProps<'/groups/[id]/add'>) {
    const { id } = await params;
    await requireMembershipOrNotFound(id);

    const backlog = await prisma.backlogItem.findMany({
        where: { groupId: id },
        select: { mediaItem: { select: { source: true, externalId: true } } },
    });

    const existingKeys = new Set(backlog.map((b) => `${b.mediaItem.source}:${b.mediaItem.externalId}`));

    return (
        <>
            <Backlink href={groupPath(id)}>Back to group</Backlink>
            <PageHeading>Add a movie</PageHeading>
            <div className="mt-4">
                <MovieSearch addAction={addToBacklog.bind(null, id)} existingKeys={[...existingKeys]} />
            </div>
        </>
    );
}
