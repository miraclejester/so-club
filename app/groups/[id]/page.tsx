import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AuthorizationError, requireMembership, roleIsAtLeast } from '@/lib/authorizationControl';
import { headers } from 'next/headers';
import InvitePanel from '@/components/InvitePanel';
import { createInvite } from '@/lib/invites';

type GroupDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { id } = await params;

    let membership;
    try {
        membership = (await requireMembership(id)).membership;
    } catch (error) {
        if (error instanceof AuthorizationError) {
            notFound();
        }
        throw error;
    }

    const group = await prisma.group.findUnique({
        where: { id },
        include: { memberships: { include: { user: true } } },
    });

    const isAdmin = roleIsAtLeast(membership.role, 'ADMIN');
    const origin = (await headers()).get('origin') ?? '';

    if (!group) {
        notFound();
    }

    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold">{group.name}</h1>
            {group.description ? <p className="mt-2 text-gray-600">{group.description}</p> : null}
            <p className="mt-4 text-sm text-gray-500">{group.memberships.length} member(s)</p>

            {isAdmin ? <InvitePanel action={createInvite.bind(null, id)} origin={origin} /> : null}
        </main>
    );
}
