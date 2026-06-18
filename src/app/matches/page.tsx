import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import SavedMatches from '@/components/SavedMatches';
import Navbar from '@/components/Navbar';

export default async function MatchesPage() {
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
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none" />
        <SavedMatches />
      </div>
    </>
  );
}
