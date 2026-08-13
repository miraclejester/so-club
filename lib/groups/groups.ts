'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ErrorState } from '@/lib/types';

const CreateGroupSchema = z.object({
    name: z.string().trim().min(1, 'Group name is required.').max(100),
    description: z.string().trim().max(500).optional(),
});

export async function createGroup(_prev: ErrorState, formData: FormData): Promise<ErrorState> {
    const user = await getCurrentUser();
    if (!user?.id) {
        redirect('/api/auth/signin');
    }

    const parsed = CreateGroupSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    let group;

    try {
        group = await prisma.group.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description,
                createdBy: { connect: { id: user.id } },
                memberships: {
                    create: {
                        role: 'OWNER',
                        user: { connect: { id: user.id } },
                    },
                },
            },
        });
    } catch {
        return { error: 'Could not create group. Please try again later.' };
    }

    revalidatePath('/groups');
    redirect(`/groups/${group.id}`);
}
