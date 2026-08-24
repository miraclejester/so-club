import { describe, it, expect, vi } from 'vitest';

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock('@/lib/auth', () => ({
    requireUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
    prisma: { membership: { findUnique } },
}));
vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => {
        throw new Error('REDIRECT');
    }),
}));

import { requireMembership, AuthorizationError, roleIsAtLeast } from '@/lib/authorizationControl';
import { requireUser } from '@/lib/auth';
import type { Role } from '@/prisma/generated/prisma/enums';
import type { Membership } from '@/prisma/generated/prisma/client';

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
        findUnique.mockResolvedValue(null);
        await expect(requireMembership('g1')).rejects.toBeInstanceOf(AuthorizationError);
    });

    it('throws when the role is insufficient', async () => {
        vi.mocked(requireUser).mockResolvedValue({
            id: 'u1',
            username: 'u1',
        });
        findUnique.mockResolvedValue(membershipWithRole('MEMBER'));
        await expect(requireMembership('g1', 'ADMIN')).rejects.toBeInstanceOf(AuthorizationError);
    });

    it('returns the membership when authorized', async () => {
        vi.mocked(requireUser).mockResolvedValue({
            id: 'u1',
            username: 'u1',
        });
        findUnique.mockResolvedValue(membershipWithRole('OWNER'));
        const result = await requireMembership('g1', 'ADMIN');
        expect(result.membership.role).toBe('OWNER');
        expect(result.userId).toBe('u1');
    });
});
