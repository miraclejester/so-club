import { requireMembershipOrNotFound } from '@/lib/authorizationControl';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { groupPath } from '@/lib/paths';
import { LocalDateTime } from '@/components/ui/local-date-time';
import { RsvpControls } from '@/components/feature/rsvp/RsvpControls';
import { Backlink } from '@/components/ui/backlink';
import { PageHeading } from '@/components/ui/page-heading';
import { RSVP_OPTIONS } from '@/lib/rsvp/labels';

export default async function SessionPage({ params }: PageProps<'/groups/[id]/sessions/[sessionId]'>) {
    const { id, sessionId } = await params;

    const { userId } = await requireMembershipOrNotFound(id);

    const session = await prisma.watchSession.findFirst({
        where: { id: sessionId, groupId: id },
        include: {
            mediaItem: true,
            createdBy: true,
            rsvps: { include: { user: true }, orderBy: { createdAt: 'asc' } },
        },
    });

    if (!session) {
        notFound();
    }

    const myStatus = session.rsvps.find((r) => r.userId === userId)?.status ?? null;

    return (
        <>
            <Backlink href={groupPath(id)}>Back to group</Backlink>
            <PageHeading>{session.mediaItem.title}</PageHeading>
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
                {RSVP_OPTIONS.map(({ value, label }) => {
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
