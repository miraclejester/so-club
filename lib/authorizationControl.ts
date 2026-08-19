import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/prisma/generated/prisma/enums';
import { Membership } from '@/prisma/generated/prisma/client';
import { notFound } from 'next/navigation';

const ROLE_RANK: Record<Role, number> = {
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
};

export type MembershipContext = {
    membership: Membership;
    userId: string;
};

export type MembershipCheck = { ok: true; membership: Membership; userId: string } | { ok: false; error: string };

export class AuthorizationError extends Error {
    constructor(message = 'Not authorized') {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export function roleIsAtLeast(role: Role, min: Role): boolean {
    return ROLE_RANK[role] >= ROLE_RANK[min];
}

export async function requireMembership(groupId: string, minRole: Role = 'MEMBER'): Promise<MembershipContext> {
    const user = await requireUser();

    const membership = await prisma.membership.findUnique({
        where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (!membership) {
        throw new AuthorizationError('You are not a member of this group.');
    }

    if (!roleIsAtLeast(membership.role, minRole)) {
        throw new AuthorizationError(`This action requires the ${minRole} role`);
    }

    return {
        membership,
        userId: user.id,
    };
}

export async function checkMembership(groupId: string, minRole: Role = 'MEMBER'): Promise<MembershipCheck> {
    try {
        const { membership, userId } = await requireMembership(groupId, minRole);
        return { ok: true, membership, userId };
    } catch (e) {
        if (e instanceof AuthorizationError) {
            return { ok: false, error: e.message };
        }
        throw e;
    }
}

export async function requireMembershipOrNotFound(
    groupId: string,
    minRole: Role = 'MEMBER'
): Promise<MembershipContext> {
    try {
        return await requireMembership(groupId, minRole);
    } catch (e) {
        if (e instanceof AuthorizationError) {
            notFound();
        }
        throw e;
    }
}
