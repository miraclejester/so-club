import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { snapshotMediaItem } from '@/lib/media/catalog/queries';
import type { MediaItem, BacklogStatus } from '@/prisma/generated/prisma/client';
import { invitePath } from '@/lib/globals';

async function main() {
    if (process.env.DATABASE_URL?.includes('supabase.com')) {
        throw new Error('Not seeding supabase database');
    }

    // --- Users (upsert on deterministic ids → idempotent) ---
    const alice = await prisma.user.upsert({
        where: { id: 'seed-user-alice' },
        update: {},
        create: { id: 'seed-user-alice', email: 'alice@example.com', username: 'alice' },
    });
    const bob = await prisma.user.upsert({
        where: { id: 'seed-user-bob' },
        update: {},
        create: { id: 'seed-user-bob', email: 'bob@example.com', username: 'bob' },
    });

    // --- Group ---
    const group = await prisma.group.upsert({
        where: { id: 'seed-group-films' },
        update: {},
        create: {
            id: 'seed-group-films',
            name: 'Friday Night Films',
            description: 'Our weekly movie club.',
            createdById: alice.id,
        },
    });

    // --- Memberships ---
    await prisma.membership.upsert({
        where: { userId_groupId: { userId: alice.id, groupId: group.id } },
        update: {},
        create: { userId: alice.id, groupId: group.id, role: 'OWNER' },
    });
    await prisma.membership.upsert({
        where: { userId_groupId: { userId: bob.id, groupId: group.id } },
        update: {},
        create: { userId: bob.id, groupId: group.id, role: 'MEMBER' },
    });

    // --- Invite with a fixed token so YOU can join the populated group ---
    const inviteToken = 'dev-seed-invite';
    await prisma.invite.upsert({
        where: { token: inviteToken },
        update: {},
        create: { groupId: group.id, token: inviteToken, createdById: alice.id },
    });

    // --- Media items ---
    const tmdbIds = ['27205', '603', '129', '496243', '438631']; // Inception, Matrix, Spirited Away, Parasite, Dune
    const items: MediaItem[] = [];

    if (process.env.TMDB_ACCESS_TOKEN) {
        for (const id of tmdbIds) {
            try {
                items.push(await snapshotMediaItem('TMDB', id)); // real data + posters, and idempotent itself
            } catch (e) {
                console.warn(`Skipped TMDB ${id}: ${(e as Error).message}`);
            }
        }
    } else {
        // Offline fallback — no token, no network.
        const stubs = [
            { externalId: '27205', title: 'Inception', releaseDate: new Date('2010-07-15') },
            { externalId: '603', title: 'The Matrix', releaseDate: new Date('1999-03-30') },
        ];
        for (const s of stubs) {
            items.push(
                await prisma.mediaItem.upsert({
                    where: { source_externalId: { source: 'TMDB', externalId: s.externalId } },
                    update: {},
                    create: {
                        source: 'TMDB',
                        externalId: s.externalId,
                        type: 'MOVIE',
                        title: s.title,
                        releaseDate: s.releaseDate,
                        metadata: {},
                    },
                })
            );
        }
    }

    // --- Backlog items with varied statuses (makes the UI look alive) ---
    const statuses: BacklogStatus[] = ['BACKLOG', 'BACKLOG', 'FINISHED', 'SCHEDULED', 'BACKLOG'];
    for (let i = 0; i < items.length; i++) {
        await prisma.backlogItem.upsert({
            where: { groupId_mediaItemId: { groupId: group.id, mediaItemId: items[i].id } },
            update: {},
            create: {
                groupId: group.id,
                mediaItemId: items[i].id,
                addedById: i % 2 === 0 ? alice.id : bob.id,
                status: statuses[i % statuses.length],
            },
        });
    }

    console.log(`Seeded "${group.name}" with ${items.length} backlog items.`);
    console.log(`Join it: http://localhost:3000${invitePath(inviteToken)}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
