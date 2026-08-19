import { requireMembership, AuthorizationError } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { scheduleWatchSession } from '@/lib/groups/watchSessions';
import ScheduleForm from '@/components/ScheduleForm';
import { JSX } from 'react';
import { GROUPS_URL } from '@/lib/globals';
import { ErrorState } from '@/lib/types';

type SchedulePageProps = {
    params: Promise<{
        id: string;
        backlogItemId: string;
    }>;
};

export default async function SchedulePage({ params }: SchedulePageProps): Promise<JSX.Element> {
    const { id, backlogItemId } = await params;

    await requireMembership(id).catch((e) => {
        if (e instanceof AuthorizationError) {
            notFound();
        }
        throw e;
    });

    const backlogItem = await prisma.backlogItem.findFirst({
        where: { id: backlogItemId, groupId: id },
        include: { mediaItem: true },
    });
    if (!backlogItem) {
        notFound();
    }

    async function scheduleAction(_prev: ErrorState, formData: FormData): Promise<ErrorState> {
        'use server';

        return scheduleWatchSession(backlogItemId, formData);
    }

    return (
        <>
            <Link href={`${GROUPS_URL}/${id}`} className="text-sm text-muted-foreground hover:underline">
                Back to group
            </Link>
            <h1 className="mt-2 text-xl font-semibold">Schedule a session</h1>
            <p className="mt-1 text-muted-foreground">{backlogItem.mediaItem.title}</p>
            <div className="mt-4">
                <ScheduleForm action={scheduleAction} />
            </div>
        </>
    );
}
