import NextAuth from 'next-auth';
import Github from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export type LoggedInUser = {
    id: string;
    username: string;
};

const githubProvider = Github({
    profile(profile) {
        return {
            id: profile.id.toString(),
            email: profile.email,
            image: profile.avatar_url,
            username: profile.login,
        };
    },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'database' },
    providers: [githubProvider],
    callbacks: {
        session({ session, user }) {
            session.user.id = user.id;
            return session;
        },
    },
});

export async function getCurrentUser(): Promise<LoggedInUser | null> {
    const session = await auth();
    return (session?.user as LoggedInUser) ?? null;
}
