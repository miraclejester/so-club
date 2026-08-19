import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
    requireUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
    prisma: { membership: { findUnique: vi.fn() } },
}));
vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => {
        throw new Error('REDIRECT');
    }),
}));

import { requireMembership, AuthorizationError, roleIsAtLeast } from '@/lib/authorizationControl';
import {requireUser} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/prisma/generated/prisma/enums';
import { Membership } from '@/prisma/generated/prisma/client';

/** Only `role` is read by requireMembership, so the rest is left off. */
const membershipWithRole = (role: Role) => ({ role }) as unknown as Membership;

describe('roleIsAtLeast', () => {
    it('ranks roles correctly', () => {
        expect(roleIsAtLeast('OWNER', 'ADMIN')).toBe(true);
        expect(roleIsAtLeast('MEMBER', 'ADMIN')).toBe(false);
        expect(roleIsAtLeast('ADMIN', 'ADMIN')).toBe(true);
    });
});

describe('requireMembership', () => {
    it('throws for a non-member', async () => {
        vi.mocked(requireUser).mockResolvedValue({
            id: 'u1',
            username: 'u1',
        });
        vi.mocked(prisma.membership.findUnique).mockResolvedValue(null);
        await expect(requireMembership('g1')).rejects.toBeInstanceOf(AuthorizationError);
    });

    it('throws when the role is insufficient', async () => {
        vi.mocked(requireUser).mockResolvedValue({
            id: 'u1',
            username: 'u1',
        });
        vi.mocked(prisma.membership.findUnique).mockResolvedValue(membershipWithRole('MEMBER'));
        await expect(requireMembership('g1', 'ADMIN')).rejects.toBeInstanceOf(AuthorizationError);
    });

    it('returns the membership when authorized', async () => {
        vi.mocked(requireUser).mockResolvedValue({
            id: 'u1',
            username: 'u1',
        });
        vi.mocked(prisma.membership.findUnique).mockResolvedValue(membershipWithRole('OWNER'));
        const result = await requireMembership('g1', 'ADMIN');
        expect(result.membership.role).toBe('OWNER');
        expect(result.userId).toBe('u1');
    });
});
