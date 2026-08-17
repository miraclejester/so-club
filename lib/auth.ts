import NextAuth from 'next-auth';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Resend from 'next-auth/providers/resend';

export type LoggedInUser = {
    id: string;
    username: string;
    image?: string;
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
    allowDangerousEmailAccountLinking: true
});

const googleProvider = Google({
    profile(profile) {
        return {
            id: profile.sub,
            email: profile.email,
            image: profile.picture,
            username: profile.family_name ?? 'unknown_user',
        };
    },
    allowDangerousEmailAccountLinking: true
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'database' },
    pages: {
        signIn: '/signin',
    },
    providers: [githubProvider, googleProvider, Resend({ from: 'send@so-club.com' })],
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
