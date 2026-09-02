'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groupPath } from '@/lib/paths';
import type { ActionResult } from '@/lib/actions/result';
import { fail, logAndFail } from '@/lib/actions/result';

const CreateGroupSchema = z.object({
    name: z.string().trim().min(1, 'Group name is required.').max(100),
    description: z.string().trim().max(500).optional(),
});

export async function createGroup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
    const user = await requireUser();

    const parsed = CreateGroupSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
    });

    if (!parsed.success) {
        return fail(parsed.error.issues[0].message);
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
    } catch (e) {
        return logAndFail('createGroup', e, 'Could not create group. Please try again later.');
    }

    revalidatePath('/groups');
    redirect(groupPath(group.id));
}
