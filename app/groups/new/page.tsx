import { requireUser } from '@/lib/auth';
import { CreateGroupForm } from '@/components/feature/groups/CreateGroupForm';
import { NEW_GROUP_URL } from '@/lib/paths';
import { PageHeading } from '@/components/layout/PageHeading';

export default async function NewGroupPage() {
    await requireUser(NEW_GROUP_URL);

    return (
        <>
            <PageHeading className="mb-4 text-xl font-semibold">Create a group</PageHeading>
            <CreateGroupForm />
        </>
    );
}
