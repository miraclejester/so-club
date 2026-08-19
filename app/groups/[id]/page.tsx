import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireMembershipOrNotFound, roleIsAtLeast } from '@/lib/authorizationControl';
import { headers } from 'next/headers';
import InvitePanel from '@/components/InvitePanel';
import { createInvite } from '@/lib/groups/invites';
import Link from 'next/link';
import { BacklogList } from '@/components/BacklogList';
import { buttonVariants } from '@/components/ui/button';
import UpcomingSessions from '@/components/UpcomingSessions';

type GroupDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { id } = await params;
    const { membership, userId } = await requireMembershipOrNotFound(id);

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

    const [group, backlog, upcoming] = await Promise.all([groupPromise, backlogPromise, upcomingPromise]);

    if (!group) {
        notFound();
    }

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
            {isAdmin ? <InvitePanel action={createInvite.bind(null, id)} origin={origin} /> : null}
        </>
    );
}
