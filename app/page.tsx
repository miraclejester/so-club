import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { GROUPS_URL } from '@/lib/globals';
import { Card } from '@/components/ui/card';

export default async function Home() {
    const user = await getCurrentUser();
    if (user?.id) {
        redirect(GROUPS_URL);
    }

    return (
        <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Complete your backlogs, <span className="text-primary">together</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Start a media club with your friends, build a shared backlog, schedule watch/play sessions and rate it
                after.
            </p>
            <div className="mt-8">
                <Link href="/signin" className={buttonVariants({ size: 'lg' })}>
                    Get started
                </Link>
            </div>

            <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
                {[
                    ['Create a club', 'Spin up a group and invite friends with a link'],
                    ['Build a backlog', 'Search movies and queue up what to watch'],
                    ['Schedule and rate', 'Plan sessions, then rate them together'],
                ].map(([title, body]) => (
                    <Card key={title} className="p-4">
                        <h3 className="font-medium">{title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    </Card>
                ))}
            </div>

            <footer className="mt-16 text-xs text-muted-foreground">
                This product uses the TMDB API but is not endorsed or certified by TMDB
            </footer>
        </main>
    );
}
