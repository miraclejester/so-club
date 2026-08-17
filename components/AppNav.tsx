import Link from 'next/link';
import { getCurrentUser, signOut } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { JSX } from 'react';

export async function AppNav(): Promise<JSX.Element> {
    const user = await getCurrentUser();

    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
                <Link href="/" className="font-semibold tracking-tight">
                    So Club
                </Link>
                {user ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image ?? undefined} alt="user icon" />
                            <AvatarFallback>{user.username?.[0] ?? '?'}</AvatarFallback>
                        </Avatar>
                        <form
                            action={async () => {
                                'use server';
                                await signOut({ redirectTo: '/' });
                            }}
                        >
                            <Button type="submit" variant="ghost" size="sm">
                                Sign out
                            </Button>
                        </form>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
