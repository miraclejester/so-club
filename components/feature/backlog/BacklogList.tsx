import type { BacklogItem, MediaItem, User, BacklogStatus, Role } from '@/prisma/generated/prisma/client';
import { roleIsAtLeast } from '@/lib/authorizationControl';
import { RemoveFromBacklogButton } from '@/components/feature/backlog/RemoveFromBacklogButton';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { schedulePath } from '@/lib/globals';
import { MediaCard } from '@/components/media/MediaCard';
import { formatYear } from '@/lib/utils';

type BacklogEntry = BacklogItem & { mediaItem: MediaItem; addedBy: User };

const STATUS_LABELS: Record<BacklogStatus, string> = {
    BACKLOG: 'Backlog',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    FINISHED: 'Finished',
};

type BacklogListProps = {
    items: BacklogEntry[];
    currentUserId: string;
    viewerRole: Role;
};

export function BacklogList({ items, currentUserId, viewerRole }: BacklogListProps) {
    if (items.length === 0) {
        return (
            <p className="mt-4 text-sm text-gray-500">
                Nothing in the backlog yet. Use &quot;Add a movie&quot; to find something to watch
            </p>
        );
    }

    return (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {items.map((item) => {
                const { id, mediaItem } = item;
                const year = formatYear(mediaItem.releaseDate);

                return (
                    <MediaCard key={id} title={mediaItem.title} year={year} coverImage={mediaItem.coverImage}>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5">{STATUS_LABELS[item.status]}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-400">
                            Added by {item.addedBy.username ?? 'unknown user'}
                        </p>

                        {item.status === 'BACKLOG' ? (
                            <Link
                                href={schedulePath(item.groupId, item.id)}
                                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                                Schedule
                            </Link>
                        ) : null}

                        {item.addedById === currentUserId || roleIsAtLeast(viewerRole, 'ADMIN') ? (
                            <RemoveFromBacklogButton
                                backlogItemId={item.id}
                                isScheduled={item.status === 'SCHEDULED'}
                            />
                        ) : null}
                    </MediaCard>
                );
            })}
        </ul>
    );
}
