import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import SwipeFeed from '@/components/SwipeFeed';
import Navbar from '@/components/Navbar';

export default async function SwipePage() {
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
      <div className="flex-grow flex flex-col justify-center items-center py-8 relative">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-brand-red/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-brand-green/5 blur-[100px] pointer-events-none" />
        <SwipeFeed />
      </div>
    </>
  );
}
