import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        invite: {
            findUnique: vi.fn<(args: Prisma.InviteFindUniqueArgs) => Promise<Invite | null>>(),
            create: vi.fn<(args: Prisma.InviteCreateArgs) => Promise<Invite>>(),
            update: vi.fn<(args: Prisma.InviteUpdateArgs) => Promise<Invite>>(),
            updateMany: vi.fn<(args: Prisma.InviteUpdateManyArgs) => Promise<{ count: number }>>(),
            // getActiveInviteWhereClause() reads prisma.invite.fields.useCount at call time
            fields: { useCount: 'useCount' },
        },
        membership: {
            findUnique: vi.fn<(args: Prisma.MembershipFindUniqueArgs) => Promise<Membership | null>>(),
            create: vi.fn<(args: Prisma.MembershipCreateArgs) => Promise<Membership>>(),
        },
        $transaction: vi.fn<(arg: unknown) => Promise<unknown>>(),
    },
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/auth', () => ({ requireUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`);
    }),
    notFound: vi.fn(() => {
        throw new Error('NOT_FOUND');
    }),
}));

import { createInvite, revokeInvite, redeemInvite } from '@/lib/invites/actions';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma as PrismaRuntime } from '@/prisma/generated/prisma/client';
import type { Invite, Membership, Prisma } from '@/prisma/generated/prisma/client';
import type { Role } from '@/prisma/generated/prisma/enums';

const membershipWithRole = (role: Role) => ({ role }) as unknown as Membership;

function makeInvite(overrides: Partial<Invite> = {}): Invite {
    return {
        id: 'i1',
        token: 'tok',
        groupId: 'g1',
        createdById: 'u1',
        expiresAt: new Date(Date.now() + 86_400_000),
        revokedAt: null,
        maxUses: null,
        useCount: 0,
        createdAt: new Date(),
        ...overrides,
    };
}

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
    // createInvite passes an array, redeemInvite passes a callback — support both shapes
    prismaMock.$transaction.mockImplementation((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg as unknown[]) : (arg as (tx: unknown) => Promise<unknown>)(prismaMock)
    );
    prismaMock.invite.findUnique.mockResolvedValue(makeInvite());
    prismaMock.invite.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.invite.create.mockResolvedValue(makeInvite());
    prismaMock.invite.update.mockResolvedValue(makeInvite());
    prismaMock.membership.create.mockResolvedValue({} as Membership);
    prismaMock.membership.findUnique.mockResolvedValue(null);
    vi.mocked(requireUser).mockResolvedValue({ id: 'u1', username: 'alice' });

    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => errorSpy.mockRestore());

describe('revokeInvite', () => {
    it('rejects a MEMBER', async () => {
        prismaMock.invite.findUnique.mockResolvedValue(makeInvite());
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('MEMBER'));

        const result = await revokeInvite('i1');

        expect(result).toEqual({ ok: false, error: 'This action requires the ADMIN role' });
        expect(prismaMock.invite.update).not.toHaveBeenCalled();
    });

    it('accepts an ADMIN', async () => {
        prismaMock.invite.findUnique.mockResolvedValue(makeInvite());
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('ADMIN'));

        const result = await revokeInvite('i1');

        expect(result).toEqual({ ok: true });
        expect(prismaMock.invite.update).toHaveBeenCalledOnce();
        const arg = prismaMock.invite.update.mock.calls[0][0];
        expect(arg.where).toEqual({ id: 'i1' });
        expect(arg.data.revokedAt).toBeInstanceOf(Date);
        expect(revalidatePath).toHaveBeenCalledWith('/groups/g1');
    });

    it('fails on invite not found', async () => {
        prismaMock.invite.findUnique.mockResolvedValue(null);
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('ADMIN'));

        const result = await revokeInvite('i1');

        expect(result).toEqual({ ok: false, error: 'Invite not found' });
        expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.invite.update).not.toHaveBeenCalled();
    });

    it('fails on membership not found', async () => {
        prismaMock.invite.findUnique.mockResolvedValue(makeInvite());
        prismaMock.membership.findUnique.mockResolvedValue(null);

        const result = await revokeInvite('i1');

        expect(result).toEqual({ ok: false, error: 'You are not a member of this group.' });
    });
});

describe('createInvite', () => {
    it('rejects a MEMBER', async () => {
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('MEMBER'));

        const result = await createInvite('g1');

        expect(result).toEqual({ ok: false, error: 'This action requires the ADMIN role' });
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('creates an invite and revokes other active invites as ADMIN', async () => {
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('ADMIN'));

        const result = await createInvite('g1');

        expect(result).toEqual({ ok: true });
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
        const args = prismaMock.$transaction.mock.calls[0][0];
        expect(Array.isArray(args) && args.length == 2).toBe(true);

        expect(prismaMock.invite.updateMany).toHaveBeenCalledOnce();
        const updateManyArgs = prismaMock.invite.updateMany.mock.calls[0][0];
        expect(updateManyArgs.where?.groupId).toEqual('g1');

        expect(prismaMock.invite.create).toHaveBeenCalledOnce();
        const createArgs = prismaMock.invite.create.mock.calls[0][0];
        expect(createArgs.data.groupId).toBe('g1');
        expect(createArgs.data.createdById).toBe('u1');
        const expiresAt = createArgs.data.expiresAt as Date;
        const days = (expiresAt.getTime() - Date.now()) / 86_400_000;
        expect(days).toBeGreaterThan(6.9);
        expect(days).toBeLessThan(7.1);
    });

    it('produces a token with the right format', async () => {
        prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('ADMIN'));

        const result = await createInvite('g1');

        expect(result).toEqual({ ok: true });
        expect(prismaMock.invite.create).toHaveBeenCalledOnce();
        const createArgs = prismaMock.invite.create.mock.calls[0][0];
        expect(createArgs.data.token).matches(/^[A-Za-z0-9_-]{43}$/);
    });

    describe('redeemInvite', () => {
        it('fails with an unknown token', async () => {
            prismaMock.invite.findUnique.mockResolvedValue(null);

            const result = await redeemInvite('someToken');
            expect(result).toEqual({ ok: false, error: 'This invite link is invalid' });
        });

        it('fails on already revoked invites', async () => {
            prismaMock.invite.findUnique.mockResolvedValue(makeInvite({ revokedAt: new Date() }));

            const result = await redeemInvite('someToken');
            expect(result).toEqual({ ok: false, error: 'This invite link is no longer active' });
        });

        it('fails on expired invites', async () => {
            prismaMock.invite.findUnique.mockResolvedValue(makeInvite({ expiresAt: new Date(Date.now() - 1000) }));

            const result = await redeemInvite('someToken');
            expect(result).toEqual({ ok: false, error: 'This invite link is no longer active' });
        });

        it('fails on exhausted invites', async () => {
            prismaMock.invite.findUnique.mockResolvedValue(makeInvite({ maxUses: 1, useCount: 1 }));

            const result = await redeemInvite('someToken');
            expect(result).toEqual({ ok: false, error: 'This invite link is no longer active' });
        });

        it('redirects a pre-existing member', async () => {
            prismaMock.membership.findUnique.mockResolvedValue(membershipWithRole('MEMBER'));

            await expect(redeemInvite('someToken')).rejects.toThrow('REDIRECT:/groups/g1');
        });

        it('fails when the invite loses a claim race', async () => {
            prismaMock.invite.updateMany.mockResolvedValue({ count: 0 });

            const result = await redeemInvite('someToken');
            expect(result).toEqual({ ok: false, error: 'This invite link is no longer active' });
            expect(prismaMock.membership.create).not.toHaveBeenCalled();
        });

        it('fails when the database gets a concurrency error', async () => {
            prismaMock.membership.create.mockRejectedValue(
                new PrismaRuntime.PrismaClientKnownRequestError('Unique constraint failed', {
                    code: 'P2002',
                    clientVersion: '7.9.1',
                })
            );
            await expect(redeemInvite('someToken')).rejects.toThrow('REDIRECT:/groups/g1');
        });

        it('redirects to the group when successful', async () => {
            await expect(redeemInvite('someToken')).rejects.toThrow('REDIRECT:/groups/g1');
            expect(prismaMock.membership.create).toHaveBeenCalledWith({
                data: {
                    userId: 'u1',
                    groupId: 'g1',
                    role: 'MEMBER',
                },
            });

            const args = prismaMock.invite.updateMany.mock.calls[0][0];
            expect(args.data).toEqual({
                useCount: { increment: 1 },
            });

            expect(revalidatePath).toHaveBeenCalledWith('/groups');
        });

        it('fails when an unexpected error happens', async () => {
            prismaMock.membership.create.mockRejectedValue(new Error('boom'));
            const result = await redeemInvite('someToken');

            expect(result).toEqual({ ok: false, error: 'Could not join the group. Please try again later' });
        });
    });
});
