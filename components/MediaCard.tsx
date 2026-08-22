import { ReactNode } from 'react';
import Image from 'next/image';

type MediaCardProps = {
    title: string;
    coverImage: string | null;
    year: string;
    children?: ReactNode;
};

export function MediaCard({ title, coverImage, year, children }: MediaCardProps) {
    return (
        <li className="rounded border p-2">
            <div className="relative aspect-2/3 w-full overflow-hidden rounded bg-gray-100">
                {coverImage ? (
                    <Image src={coverImage} alt={title} fill className="object-cover" sizes="150px" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">No poster</div>
                )}
            </div>
            <p className="mt-1 truncate text-sm font-medium" title={title}>
                {title}
            </p>
            <p className="text-xs text-gray-500">{year}</p>
            {children}
        </li>
    );
}
