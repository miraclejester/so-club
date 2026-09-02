import { requireUser } from '@/lib/auth';
import { CreateGroupForm } from '@/components/feature/groups/CreateGroupForm';
import { GROUPS_URL } from '@/lib/paths';
import { PageHeading } from '@/components/layout/PageHeading';

export default async function NewGroupPage() {
    await requireUser(`${GROUPS_URL}/new`);

    return (
        <>
            <PageHeading className="mb-4 text-xl font-semibold">Create a group</PageHeading>
            <CreateGroupForm />
        </>
    );
}
