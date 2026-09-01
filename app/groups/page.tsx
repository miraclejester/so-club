import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { GROUPS_URL } from '@/lib/globals';
import { buttonVariants } from '@/components/ui/button';
import { PageHeading } from '@/components/layout/PageHeading';
import { Card } from '@/components/ui/card';

export default async function GroupsPage() {
    const user = await requireUser(GROUPS_URL);

    const memberships = await prisma.membership.findMany({
        where: { userId: user.id },
        include: {
            group: {
                include: { _count: { select: { memberships: true } } },
            },
        },
        orderBy: { joinedAt: 'desc' },
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <PageHeading className="text-xl font-semibold">Your Groups</PageHeading>
                <Link href="/groups/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Create group
                </Link>
            </div>
            {memberships.length === 0 ? (
                <p className="mt-6 text-gray-600">
                    You&apos;re not in any groups yet.{' '}
                    <Link href="/groups/new" className="underline">
                        Create one
                    </Link>{' '}
                    or ask a friend for an invite link.
                </p>
            ) : (
                <ul className="mt-6 space-y-2">
                    {memberships.map((m) => (
                        <li key={m.group.id}>
                            <Link href={`/groups/${m.group.id}`}>
                                <Card className="px-4 py-3 gap-1 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{m.group.name}</span>
                                        <span className="text-xs uppercase text-gray-400">{m.role}</span>
                                    </div>
                                    {m.group.description ? (
                                        <p className="mt-1 text-sm text-gray-600">{m.group.description}</p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-gray-400">
                                        {m.group._count.memberships} member{m.group._count.memberships === 1 ? '' : 's'}
                                    </p>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
