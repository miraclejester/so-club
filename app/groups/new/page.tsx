import { requireUser } from '@/lib/auth';
import { CreateGroupForm } from '@/components/CreateGroupForm';
import { GROUPS_URL } from '@/lib/globals';
import { PageHeading } from '@/components/PageHeading';

export default async function NewGroupPage() {
    await requireUser(`${GROUPS_URL}/new`);

    return (
        <main className="p-6">
            <PageHeading className="mb-4 text-xl font-semibold">Create a group</PageHeading>
            <CreateGroupForm />
        </main>
    );
}
