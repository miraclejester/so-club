import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SIGN_IN_URL } from '@/lib/globals';

export default async function GroupsPage() {
    const user = await getCurrentUser();
    if (!user?.id) {
        redirect(`${SIGN_IN_URL}?callbackUrl=/groups`);
    }

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
                <h1 className="text-xl font-semibold">Your Groups</h1>
                <Link href="/groups/new" className="rounded border px-3 py-1 text-sm">
                    Create group
                </Link>
            </div>
            {memberships.length === 0 ? (
                <p className="mt-6, text-gray-600">
                    You're not in any groups yet.{' '}
                    <Link href="/groups/new" className="underline">
                        Create one
                    </Link>{' '}
                    or ask a friend for an invite link.
                </p>
            ) : (
                <ul className="mt-6 space-y-2">
                    {memberships.map((m) => (
                        <li key={m.group.id}>
                            <Link
                                href={`/groups/${m.group.id}`}
                                className="block rounded border px-4 py-3 hover:bg-gray-50"
                            >
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
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
