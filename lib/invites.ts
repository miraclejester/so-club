'use server';
import {
    AuthorizationError,
    requireMembership,
} from '@/lib/authorizationControl';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type CreateInviteState = { token: string | null; error: string | null };

export async function createInvite(
    groupId: string
): Promise<CreateInviteState> {
    let userId;
    try {
        const context = await requireMembership(groupId, 'ADMIN');
        userId = context.userId;
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return {
                token: null,
                error: 'Only group admins can create invites',
            };
        }
        throw e;
    }

    try {
        const invite = await prisma.invite.upsert({
            where: { groupId },
            update: {},
            create: { groupId, createdById: userId },
        });

        revalidatePath(`/groups/${groupId}/`);
        return { token: invite.token, error: null };
    } catch (e) {
        console.error(e);
        return {
            token: null,
            error: 'Could not create invite. Please try again later',
        };
    }
}
