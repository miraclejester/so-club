import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/prisma/generated/prisma/enums';
import type { Membership } from '@/prisma/generated/prisma/client';
import { notFound } from 'next/navigation';
import type { ActionResult } from '@/lib/actions/result';
import { fail, ok } from '@/lib/actions/result';

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
export type GroupResource<T> = { resource: T; userId: string; membership: Membership };

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

// Loads a resource through the load function. The user should be authenticated within the group the resource points to
export async function loadGroupResource<T extends { groupId: string }>(
    load: () => Promise<T | null>,
    notFoundMessage: string,
    minRole: Role = 'MEMBER'
): Promise<ActionResult<GroupResource<T>>> {
    const resource = await load();
    if (!resource) {
        return fail(notFoundMessage);
    }

    const check = await checkMembership(resource.groupId, minRole);
    if (!check.ok) {
        return fail(check.error);
    }

    return ok({ resource, userId: check.userId, membership: check.membership });
}
