import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import GlobalExplorer from '@/components/GlobalExplorer';

export default async function ExplorePage() {
  const user = await getSessionUser();

  let isNew = false;
  if (user) {
    try {
      const prefs = user.preferredLanguages ? JSON.parse(user.preferredLanguages) : [];
      isNew = prefs.length === 0;
    } catch {
      isNew = true;
    }
    if (isNew) {
      redirect('/onboarding');
    }
  }

  return (
    <DashboardLayout>
      <div className={`flex-grow flex flex-col items-center relative ${user ? 'justify-start pt-8 pb-6' : 'justify-center h-full px-4 md:px-8'}`}>
        <GlobalExplorer user={user} />
      </div>
    </DashboardLayout>
  );
}
