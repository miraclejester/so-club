import { JSX, ReactNode } from 'react';
import { getInvite, type InviteWithDetails, redeemInvite } from '@/lib/invites';
import { getCurrentUser, LoggedInUser } from '@/lib/auth';
import { RedeemButton } from '@/components/RedeemButton';
import Link from 'next/link';

type InvitePageProps = {
    params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps): Promise<JSX.Element> {
    const { token } = await params;

    const invite: InviteWithDetails | null = await getInvite(token);
    if (!invite) {
        return (
            <Shell>
                {' '}
                <p>This invite link is invalid or has been removed</p>
            </Shell>
        );
    }

    if (invite.expired || invite.exhausted) {
        return (
            <Shell>
                <p>This invite link is no longer active</p>
            </Shell>
        );
    }

    const user: LoggedInUser | null = await getCurrentUser();
    const signedIn: boolean = user !== null;

    return (
        <Shell>
            <h1 className="text-xl font-semibold">Join "{invite.group.name}"</h1>
            {invite.group.description ? <p className="mt-2 text-gray-600">{invite.group.description}</p> : null}
            <div className="mt-4">
                {signedIn ? (
                    <RedeemButton action={redeemInvite.bind(null, token)} />
                ) : (
                    <Link href={`api/auth/signin?callbackUrl=/invite/${token}`} className="rounded border px-3 py-1">
                        Sign in to join
                    </Link>
                )}
            </div>
        </Shell>
    );
}

function Shell({ children }: { children: ReactNode }): JSX.Element {
    return <main className="mx-auto max-w-md p-6">{children}</main>;
}
