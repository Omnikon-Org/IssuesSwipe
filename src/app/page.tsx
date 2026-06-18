import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';
import Navbar from '@/components/Navbar';

export default async function Home() {
  const user = await getSessionUser();

  if (user) {
    if (!user.onboardingCompleted) {
      redirect('/onboarding');
    } else {
      redirect('/swipe');
    }
  }

  return (
    <>
      <Navbar />
      <LandingPage />
    </>
  );
}
