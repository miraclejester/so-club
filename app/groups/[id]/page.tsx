import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireMembershipOrNotFound, roleIsAtLeast } from '@/lib/authorizationControl';
import InvitePanel from '@/components/InvitePanel';
import { createInvite, revokeInvite } from '@/lib/groups/invites';
import Link from 'next/link';
import { BacklogList } from '@/components/BacklogList';
import { buttonVariants } from '@/components/ui/button';
import UpcomingSessions from '@/components/UpcomingSessions';
import { getActiveInvites } from '@/lib/groups/inviteQueries';
import { Invite } from '@/prisma/generated/prisma/client';

type GroupDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { id } = await params;
    const { membership, userId } = await requireMembershipOrNotFound(id);
    const isAdmin = roleIsAtLeast(membership.role, 'ADMIN');

    const groupPromise = prisma.group.findUnique({
        where: { id },
        include: {
            memberships: {
                include: { user: true },
                orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
            },
        },
    });

    const backlogPromise = prisma.backlogItem.findMany({
        where: { groupId: id },
        include: { mediaItem: true, addedBy: true },
        orderBy: { createdAt: 'desc' },
    });

    const upcomingPromise = prisma.watchSession.findMany({
        where: { groupId: id, scheduledFor: { gte: new Date() } },
        orderBy: { scheduledFor: 'asc' },
        include: {
            mediaItem: { select: { title: true } },
            rsvps: { where: { userId }, select: { status: true } },
            _count: { select: { rsvps: { where: { status: 'GOING' } } } },
        },
    });

    const invitePromise: Promise<Invite[]> = isAdmin ? getActiveInvites(id) : Promise.resolve([]);

    const [group, backlog, upcoming, invites] = await Promise.all([
        groupPromise,
        backlogPromise,
        upcomingPromise,
        invitePromise,
    ]);

    if (!group) {
        notFound();
    }

    const activeInvite: Invite | null = invites.length === 0 ? null : invites[0];

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
                <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
                <UpcomingSessions sessions={upcoming} />
            </section>

            <section className="mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-500">Backlog ({backlog.length})</h2>
                    <Link href={`/groups/${id}/add`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Add a movie
                    </Link>
                </div>
                <BacklogList items={backlog} currentUserId={userId} viewerRole={membership.role} />
            </section>
            {isAdmin ? (
                <InvitePanel
                    action={createInvite.bind(null, id)}
                    revokeAction={revokeInvite.bind(null, activeInvite?.id ?? '')}
                    invite={activeInvite}
                />
            ) : null}
        </>
    );
}
