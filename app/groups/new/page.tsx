import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateGroupForm from '@/components/CreateGroupForm';
import { SIGN_IN_URL } from '@/lib/globals';

export default async function NewGroupPage() {
    const session = await auth();
    if (!session) {
        redirect(SIGN_IN_URL);
    }

    return (
        <main className="p-6">
            <h1 className="mb-4 text-xl font-semibold">Create a group</h1>
            <CreateGroupForm />
        </main>
    );
}
