import {auth} from '@/lib/auth';
import {redirect} from 'next/navigation';
import CreateGroupForm from '@/components/CreateGroupForm';

export default async function NewGroupPage() {
    const session = await auth();
    if (!session) {
        redirect('api/auth/signin')
    }
    
    return (
        <main className='p-6'>
            <h1 className='mb-4 text-xl font-semibold'>Create a group</h1>
            <CreateGroupForm />
        </main>
    )
}