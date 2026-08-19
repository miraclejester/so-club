import { requireMembership, AuthorizationError } from '@/lib/authorizationControl';
import { JSX } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GROUPS_URL } from '@/lib/globals';
import Link from 'next/link';
import LocalDateTime from '@/components/LocalDateTime';
import type { RsvpStatus } from '@/prisma/generated/prisma/enums';
import RsvpControls from '@/components/RsvpControls';

type SessionPageProps = {
    params: Promise<{
        id: string;
        sessionId: string;
    }>;
};

export type RsvpOption = {
    value: RsvpStatus;
    label: string;
};

const OPTIONS: RsvpOption[] = [
    { value: 'GOING', label: 'Going' },
    { value: 'MAYBE', label: 'Maybe' },
    { value: 'NOT_GOING', label: "Can't Go" },
];

export default async function SessionPage({ params }: SessionPageProps): Promise<JSX.Element> {
    const { id, sessionId } = await params;

    const { userId } = await requireMembership(id).catch((e) => {
        if (e instanceof AuthorizationError) {
            notFound();
        }
        throw e;
    });

    const session = await prisma.watchSession.findUnique({
        where: { id: sessionId },
        include: {
            mediaItem: true,
            createdBy: true,
            rsvps: { include: { user: true }, orderBy: { createdAt: 'asc' } },
        },
    });

    if (!session || session.groupId !== id) {
        notFound();
    }

    const myStatus = session.rsvps.find((r) => r.userId === userId)?.status ?? null;

    return (
        <>
            <Link href={`${GROUPS_URL}/${id}`} className="text-sm text-muted-foreground hover:underline">
                Back to group
            </Link>
            <h1 className="mt-2 text-xl font-semibold">{session.mediaItem.title}</h1>
            <p className="mt-1 text-muted-foreground">
                <LocalDateTime iso={session.scheduledFor.toISOString()} dateStyle="full" timeStyle="short" />
            </p>
            <p className="mt-1 text-sm">{session.location ?? 'Location Unknown'}</p>
            {session.notes ? <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p> : null}

            <section className="mt-6">
                <h2 className="text-sm font-medium text-muted-foreground">Your response</h2>
                <div className="mt-2">
                    <RsvpControls sessionId={session.id} currentStatus={myStatus} />
                </div>
            </section>

            <section className="mt-8 space-y-4">
                {OPTIONS.map(({ value, label }) => {
                    const people = session.rsvps.filter((r) => r.status === value);
                    return (
                        <div key={value}>
                            <h3 className="text-sm font-medium">
                                {label} ({people.length})
                            </h3>
                            {people.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nobody yet</p>
                            ) : (
                                <ul className="mt-1 text-sm">
                                    {people.map((rsvp) => (
                                        <li key={rsvp.id}>{rsvp.user.username ?? 'Unknown user'}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </section>
        </>
    );
}
