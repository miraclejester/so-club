import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { JSX } from 'react';

export default function SignInPage(): JSX.Element {
    async function goToSignIn(providerId: string) {
        'use server';
        await signIn(providerId, { redirectTo: '/groups' });
    }

    async function sendMagicLink(formData: FormData) {
        'use server';
        await signIn('resend', {
            email: formData.get('email') as string,
            redirectTo: '/groups',
        });
    }

    return (
        <>
            <Card className="p-6">
                <h1 className="text-lg font-semibold">Sign In to SoClub</h1>

                <form className="mt-4 flex flex-col gap-2" action={sendMagicLink}>
                    <Input name="email" type="email" placeholder="you@example.com" required />
                    <Button type="submit" className="w-full">
                        Send magic link
                    </Button>
                </form>

                <div className="my-4 text-center text-xs text-muted-foreground">or</div>

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
        </>
    );
}
