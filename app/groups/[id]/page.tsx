import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AuthorizationError, requireMembership, roleIsAtLeast } from '@/lib/authorizationControl';
import { headers } from 'next/headers';
import InvitePanel from '@/components/InvitePanel';
import { createInvite } from '@/lib/groups/invites';
import Link from 'next/link';
import { BacklogList } from '@/components/BacklogList';

type GroupDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { id } = await params;

    const { membership } = await requireMembership(id).catch((e) => {
        if (e instanceof AuthorizationError) {
            notFound();
        }
        throw e;
    });

    const group = await prisma.group.findUnique({
        where: { id },
        include: {
            memberships: {
                include: { user: true },
                orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
            },
        },
    });

    if (!group) {
        notFound();
    }

    const backlog = await prisma.backlogItem.findMany({
        where: { groupId: id },
        include: { mediaItem: true, addedBy: true },
        orderBy: { createdAt: 'desc' },
    });

    const isAdmin = roleIsAtLeast(membership.role, 'ADMIN');
    const origin = (await headers()).get('origin') ?? '';

    return (
        <>
            <Link href="/groups" className="text-sm text-gray-500 hover:underline">
                Back to your groups
            </Link>

            <h1 className="mt-2 text-xl font-semibold">{group.name}</h1>
            {group.description ? <p className="mt-2 text-gray-600">{group.description}</p> : null}

            <section className="mt-6">
                <h2 className="text-sm font-medium text-gray-500">Members: {group.memberships.length}</h2>
                <ul className="mt-2 divide-y rounded border">
                    {group.memberships.map((m) => (
                        <li key={m.id} className="flex items-center justify-between px-3 py-2">
                            <span>{m.user.username ?? 'Unknown'}</span>
                            <span className="text-xs uppercase text-gray-400">{m.role}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-500">Backlog ({backlog.length})</h2>
                    <Link href={`/groups/${id}/add`} className="rounded border px-3 py-1 text-sm">
                        Add a movie
                    </Link>
                </div>
                <BacklogList items={backlog} />
            </section>
            {isAdmin ? <InvitePanel action={createInvite.bind(null, id)} origin={origin} /> : null}
        </>
    );
}
