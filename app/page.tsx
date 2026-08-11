import AuthButton from '@/components/AuthButton';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
    const user = await getCurrentUser();
    return (
        <main>
            <h1>{user ? `Welcome, ${user.username}!` : `Welcome, guest`}</h1>
            <AuthButton />
        </main>
    );
}
