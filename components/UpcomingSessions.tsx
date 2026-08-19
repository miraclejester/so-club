import type { RsvpStatus } from '@/prisma/generated/prisma/client';
import { JSX } from 'react';
import Link from 'next/link';
import { GROUPS_URL } from '@/lib/globals';
import { Badge } from '@/components/ui/badge';
import LocalDateTime from '@/components/LocalDateTime';

type UpcomingSessionData = {
    id: string;
    groupId: string;
    scheduledFor: Date;
    mediaItem: { title: string };
    rsvps: { status: RsvpStatus }[];
    _count: { rsvps: number };
};

type UpcomingSessionsProps = {
    sessions: UpcomingSessionData[];
};

const RSVP_LABEL: Record<RsvpStatus, string> = {
    GOING: 'Going',
    MAYBE: 'Maybe',
    NOT_GOING: 'Not Going',
};

export default function UpcomingSessions({ sessions }: UpcomingSessionsProps): JSX.Element {
    if (sessions.length === 0) {
        return (
            <p className="mt-4 text-sm text-muted-foreground">No upcoming sessions. Schedule one from a backlog item</p>
        );
    }

    return (
        <ul className="mt-4 space-y-2">
            {sessions.map((session) => {
                const myStatus = session.rsvps[0]?.status ?? null;
                return (
                    <li key={session.id}>
                        <Link
                            href={`${GROUPS_URL}/${session.groupId}/sessions/${session.id}`}
                            className="block rounded-lg border p-3 hover:bg-muted/50"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium">{session.mediaItem.title}</span>
                                {myStatus ? (
                                    <Badge variant="secondary">{RSVP_LABEL[myStatus]}</Badge>
                                ) : (
                                    <Badge variant="outline">Respond</Badge>
                                )}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                <LocalDateTime
                                    iso={session.scheduledFor.toISOString()}
                                    dateStyle="medium"
                                    timeStyle="short"
                                />
                                <span>{session._count.rsvps} going</span>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
