import { requireUser } from '@/lib/auth';
import CreateGroupForm from '@/components/CreateGroupForm';
import { GROUPS_URL } from '@/lib/globals';

export default async function NewGroupPage() {
    await requireUser(`${GROUPS_URL}/new`);

    return (
        <main className="p-6">
            <h1 className="mb-4 text-xl font-semibold">Create a group</h1>
            <CreateGroupForm />
        </main>
    );
}
