import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { PageHeading } from '@/components/layout/PageHeading';
import { EmailSchema, singleStringParamUrl } from '@/lib/validation';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rateLimit';
import { GROUPS_URL } from '@/lib/globals';

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked:
        'That email is already registered with a different sign-in method. Please sign-in the way' +
        ' you did the first time',
    RateLimited: 'Your request has been rate limited',
    InvalidEmail: 'Invalid email address',
};

function getSignInUrl(errorCode: string, redirectUrl: string) {
    return `/signin?error=${errorCode}&callbackUrl=${encodeURIComponent(redirectUrl)}`;
}

export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
    const { callbackUrl, error } = await searchParams;

    const errorMessage = error
        ? (ERROR_MESSAGES[error as string] ?? 'Could not sign you in. Please try again later')
        : null;

    const parser = singleStringParamUrl('Invalid callback url', GROUPS_URL);
    const redirectUrl = parser.parse(callbackUrl);

    async function goToSignIn(providerId: string) {
        'use server';
        await signIn(providerId, { redirectTo: redirectUrl });
    }

    async function sendMagicLink(formData: FormData) {
        'use server';

        const parsed = EmailSchema.safeParse(formData.get('email'));
        if (!parsed.success) {
            redirect(getSignInUrl('InvalidEmail', redirectUrl));
        }

        const forwarded = (await headers()).get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

        const ipBanned = !rateLimit(`magiclink:ip:${ip}`, 10, 15 * 60_000);
        if (ipBanned) {
            redirect(getSignInUrl('RateLimited', redirectUrl));
        }

        const emailBanned = !rateLimit(`magiclink:${parsed.data}`, 3, 15 * 60_000);
        if (emailBanned) {
            redirect(getSignInUrl('RateLimited', redirectUrl));
        }

        await signIn('resend', {
            email: parsed.data,
            redirectTo: redirectUrl,
        });
    }

    return (
        <Card className="p-6">
            <PageHeading className="text-lg font-semibold">Sign In to SoClub</PageHeading>

            {errorMessage ? <FormError className="mt-2">{errorMessage}</FormError> : null}

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
    );
}
