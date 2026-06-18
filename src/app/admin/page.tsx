import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';
import Navbar from '@/components/Navbar';

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/');
  }

  return (
    <>
      <Navbar />
      <div className="flex-grow py-8 relative">
        <div className="absolute top-[10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-brand-red/5 blur-[100px] pointer-events-none" />
        <AdminDashboard />
      </div>
    </>
  );
}
