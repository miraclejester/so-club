import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import {
    AuthorizationError,
    requireMembership,
} from '@/lib/authorizationControl';

type GroupDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({
    params,
}: GroupDetailPageProps) {
    const { id } = await params;

    try {
        await requireMembership(id);
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

    if (!group) {
        notFound();
    }

    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold">{group.name}</h1>
            {group.description ? (
                <p className="mt-2 text-gray-600">{group.description}</p>
            ) : null}
            <p className="mt-4 text-sm text-gray-500">
                {group.memberships.length} member(s)
            </p>
        </main>
    );
}
