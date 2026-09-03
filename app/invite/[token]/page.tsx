import { redeemInvite } from '@/lib/invites/actions';
import type { LoggedInUser } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';
import { RedeemButton } from '@/components/feature/invites/RedeemButton';
import Link from 'next/link';
import type { InviteWithDetails } from '@/lib/invites/types';
import { getInvite } from '@/lib/invites/queries';
import { PageHeading } from '@/components/ui/page-heading';
import { buttonVariants } from '@/components/ui/button';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { SIGN_IN_URL, invitePath } from '@/lib/paths';

export default async function InvitePage({ params }: PageProps<'/invite/[token]'>) {
    const [{ token }, ip] = await Promise.all([params, getClientIp()]);

    if (!rateLimit(`invite:${ip}`, 20, 60_000)) {
        return <p>Too many attempts. Please try again in a minute</p>;
    }

    const invite: InviteWithDetails | null = await getInvite(token);
    if (!invite) {
        return <p>This invite link is invalid or has been removed</p>;
    }

    if (!invite.active) {
        return <p>This invite link is no longer active</p>;
    }

    const user: LoggedInUser | null = await getCurrentUser();
    const signedIn: boolean = user !== null;

    return (
        <>
            <PageHeading className="text-xl font-semibold">Join &quot;{invite.group.name}&quot;</PageHeading>
            {invite.group.description ? <p className="mt-2 text-gray-600">{invite.group.description}</p> : null}
            <div className="mt-4">
                {signedIn ? (
                    <RedeemButton action={redeemInvite.bind(null, token)} />
                ) : (
                    <Link
                        href={`${SIGN_IN_URL}?callbackUrl=${encodeURIComponent(invitePath(token))}`}
                        className={buttonVariants({ size: 'lg' })}
                    >
                        Sign in to join
                    </Link>
                )}
            </div>
        </>
    );
}
