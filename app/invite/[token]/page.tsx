import { redeemInvite } from '@/lib/groups/invites';
import { getCurrentUser, LoggedInUser } from '@/lib/auth';
import { RedeemButton } from '@/components/RedeemButton';
import Link from 'next/link';
import { getInvite, InviteWithDetails } from '@/lib/groups/inviteQueries';
import { PageHeading } from '@/components/PageHeading';
import { buttonVariants } from '@/components/ui/button';

export default async function InvitePage({ params }: PageProps<'/invite/[token]'>) {
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
            <PageHeading className="text-xl font-semibold">Join "{invite.group.name}"</PageHeading>
            {invite.group.description ? <p className="mt-2 text-gray-600">{invite.group.description}</p> : null}
            <div className="mt-4">
                {signedIn ? (
                    <RedeemButton action={redeemInvite.bind(null, token)} />
                ) : (
                    <Link href={`/signin?callbackUrl=/invite/${token}`} className={buttonVariants({ size: 'lg' })}>
                        Sign in to join
                    </Link>
                )}
            </div>
        </>
    );
}
