import NextAuth from 'next-auth';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Resend from 'next-auth/providers/resend';
import { SIGN_IN_URL } from '@/lib/globals';
import { redirect } from 'next/navigation';

export type LoggedInUser = {
    id: string;
    username: string | null;
    image?: string | null;
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

const googleProvider = Google({
    profile(profile) {
        return {
            id: profile.sub,
            email: profile.email,
            image: profile.picture,
            username: profile.name ?? 'unknown_user',
        };
    },
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
            session.user.username = user.username;
            return session;
        },
    },
});

export async function getCurrentUser(): Promise<LoggedInUser | null> {
    const session = await auth();
    return session?.user ?? null;
}

export async function requireUser(callbackUrl?: string): Promise<LoggedInUser> {
    const user = await getCurrentUser();
    if (!user?.id) {
        redirect(callbackUrl ? `${SIGN_IN_URL}?callbackUrl=${encodeURIComponent(callbackUrl)}` : SIGN_IN_URL);
    }
    return user;
}
