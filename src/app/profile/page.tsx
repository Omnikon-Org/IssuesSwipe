import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import UserProfile from '@/components/UserProfile';
import Navbar from '@/components/Navbar';

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  return (
    <>
      <Navbar />
      <div className="flex-grow py-8 relative">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-brand-purple/5 blur-[100px] pointer-events-none" />
        <UserProfile />
      </div>
    </>
  );
}
