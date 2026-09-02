import { requireMembershipOrNotFound } from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { scheduleWatchSession } from '@/lib/watchSessions/actions';
import { ScheduleForm } from '@/components/feature/watchSessions/ScheduleForm';
import { groupPath } from '@/lib/paths';
import type { ActionResult } from '@/lib/actions/result';
import { Backlink } from '@/components/layout/Backlink';
import { PageHeading } from '@/components/layout/PageHeading';

export default async function SchedulePage({ params }: PageProps<'/groups/[id]/schedule/[backlogItemId]'>) {
    const { id, backlogItemId } = await params;

    await requireMembershipOrNotFound(id);

    const backlogItem = await prisma.backlogItem.findFirst({
        where: { id: backlogItemId, groupId: id },
        include: { mediaItem: true },
    });
    if (!backlogItem || backlogItem.status === 'SCHEDULED') {
        notFound();
    }

    async function scheduleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
        'use server';

        return scheduleWatchSession(backlogItemId, formData);
    }

    return (
        <>
            <Backlink href={groupPath(id)}>Back to group</Backlink>
            <PageHeading>Schedule a session</PageHeading>
            <p className="mt-1 text-muted-foreground">{backlogItem.mediaItem.title}</p>
            <div className="mt-4">
                <ScheduleForm action={scheduleAction} />
            </div>
        </>
    );
}
