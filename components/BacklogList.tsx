import Image from 'next/image';
import type { BacklogItem, MediaItem, User, BacklogStatus, Role } from '@/prisma/generated/prisma/client';
import { JSX } from 'react';
import { roleIsAtLeast } from '@/lib/authorizationControl';
import RemoveFromBacklogButton from '@/components/RemoveFromBacklogButton';

type BacklogEntry = BacklogItem & { mediaItem: MediaItem; addedBy: User };

const STATUS_LABELS: Record<BacklogStatus, string> = {
    BACKLOG: 'Backlog',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'InProgress',
    FINISHED: 'Finished',
};

type BacklogListProps = {
    items: BacklogEntry[];
    currentUserId: string;
    viewerRole: Role;
};

export function BacklogList({ items, currentUserId, viewerRole }: BacklogListProps): JSX.Element {
    if (items.length === 0) {
        return (
            <p className="mt-4 text-sm text-gray-500">
                Nothing in the backlog yet. Use "Add a movie" to find something to watch
            </p>
        );
    }

    return (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {items.map((item) => {
                const { id, mediaItem } = item;
                const year = mediaItem.releaseDate ? new Date(mediaItem.releaseDate).getFullYear() : null;

                return (
                    <li key={id} className="rounded border p-2">
                        <div className="relative aspect-2/3 w-full overflow-hidden rounded bg-gray-100">
                            {mediaItem.coverImage ? (
                                <Image
                                    src={mediaItem.coverImage}
                                    alt={mediaItem.title}
                                    fill
                                    className="object-cover"
                                    sizes="150px"
                                />
                            ) : (
                                <div className="flex items-center justify-center text-xs text-gray-400">No poster</div>
                            )}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium" title={mediaItem.title}>
                            {mediaItem.title}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{year ?? '--'}</span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5">{STATUS_LABELS[item.status]}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-400">
                            Added by {item.addedBy.username ?? 'unknown user'}
                        </p>
                        {item.addedById === currentUserId || roleIsAtLeast(viewerRole, 'ADMIN') ? (
                            <RemoveFromBacklogButton backlogItemId={item.id} />
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
