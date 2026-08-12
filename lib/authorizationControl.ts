import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/prisma/generated/prisma/enums';
import { Membership } from '@/prisma/generated/prisma/client';
import { redirect } from 'next/navigation';

const ROLE_RANK: Record<Role, number> = {
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
};

type MembershipContext = {
    membership: Membership;
    userId: string;
};

export class AuthorizationError extends Error {
    constructor(message = 'Not authorized') {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export function roleIsAtLeast(role: Role, min: Role): boolean {
    return ROLE_RANK[role] >= ROLE_RANK[min];
}

export async function requireMembership(
    groupId: string,
    minRole: Role = 'MEMBER'
): Promise<MembershipContext> {
    const user = await getCurrentUser();
    if (!user?.id) {
        redirect('/api/auth/signin');
    }

    const membership = await prisma.membership.findUnique({
        where: { userId_groupId: { userId: user.id, groupId } },
    });

    if (!membership) {
        throw new AuthorizationError('You are not a member of this group.');
    }

    if (!roleIsAtLeast(membership.role, minRole)) {
        throw new AuthorizationError(
            `This action requires the ${minRole} role`
        );
    }

    return {
        membership,
        userId: user.id,
    };
}
