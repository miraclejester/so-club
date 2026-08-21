import { JSX } from 'react';
import { type InviteWithDetails, redeemInvite } from '@/lib/groups/invites';
import { getCurrentUser, LoggedInUser } from '@/lib/auth';
import { RedeemButton } from '@/components/RedeemButton';
import Link from 'next/link';
import { getInvite } from '@/lib/groups/inviteQueries';

type InvitePageProps = {
    params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps): Promise<JSX.Element> {
    const { token } = await params;

    const invite: InviteWithDetails | null = await getInvite(token);
    if (!invite) {
        return (
            <>
                {' '}
                <p>This invite link is invalid or has been removed</p>
            </>
        );
    }

    if (!invite.active) {
        return (
            <>
                <p>This invite link is no longer active</p>
            </>
        );
    }

    const user: LoggedInUser | null = await getCurrentUser();
    const signedIn: boolean = user !== null;

    return (
        <>
            <h1 className="text-xl font-semibold">Join "{invite.group.name}"</h1>
            {invite.group.description ? <p className="mt-2 text-gray-600">{invite.group.description}</p> : null}
            <div className="mt-4">
                {signedIn ? (
                    <RedeemButton action={redeemInvite.bind(null, token)} />
                ) : (
                    <Link href={`/signin?callbackUrl=/invite/${token}`} className="rounded border px-3 py-1">
                        Sign in to join
                    </Link>
                )}
            </div>
        </>
    );
}
