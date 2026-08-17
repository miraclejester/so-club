import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { JSX } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked:
        'That email is already registered with a different sign-in method. Please sign-in the way' +
        ' you did the first time',
};

type SignInProps = {
    searchParams: Promise<{
        callbackUrl?: string;
        error?: string;
    }>;
};

export default async function SignInPage({ searchParams }: SignInProps): Promise<JSX.Element> {
    const { callbackUrl, error } = await searchParams;

    const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Could not sign you in. Please try again later') : null;

    const redirectUrl = callbackUrl ?? '/groups';

    async function goToSignIn(providerId: string) {
        'use server';
        await signIn(providerId, { redirectTo: redirectUrl });
    }

    async function sendMagicLink(formData: FormData) {
        'use server';
        await signIn('resend', {
            email: formData.get('email') as string,
            redirectTo: redirectUrl,
        });
    }

    return (
        <>
            <Card className="p-6">
                <h1 className="text-lg font-semibold">Sign In to SoClub</h1>

                {errorMessage ? (
                    <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                ) : null}

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
