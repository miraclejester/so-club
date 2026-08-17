import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JSX } from 'react';

export default function SignInPage(): JSX.Element {
    async function goToSignIn(providerId: string) {
        'use server';
        await signIn(providerId, { redirectTo: '/groups' });
    }

    return (
        <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-4">
            <Card className="p-6">
                <h1 className="text-lg font-semibold">Sign In to SoClub</h1>
                <div className="mt-4 flex flex-col gap-2">
                    <form action={goToSignIn.bind(null, 'github')}>
                        <Button type="submit" className="w-full" variant="outline">
                            Continue with Github
                        </Button>
                    </form>
                    <form action={goToSignIn.bind(null, 'google')}>
                        <Button type="submit" className="w-full" variant="outline">
                            Continue with Google
                        </Button>
                    </form>
                </div>
            </Card>
        </main>
    );
}
