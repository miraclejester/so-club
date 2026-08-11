import { auth, signIn, signOut } from '@/lib/auth';

export default async function AuthButton() {
    const session = await auth();
    const buttonClassName = 'bg-red-400 text-white cursor-pointer p-4';

    if (session?.user) {
        return (
            <form
                action={async () => {
                    'use server';
                    await signOut();
                }}
            >
                <button className={buttonClassName} type="submit">
                    Sign out
                </button>
            </form>
        );
    }

    return (
        <form
            action={async () => {
                'use server';
                await signIn('github');
            }}
        >
            <button className={buttonClassName} type="submit">
                Sign in with Github
            </button>
        </form>
    );
}
