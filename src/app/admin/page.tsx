import { redirect } from 'next/navigation';
import { getSessionUser, getAdminStatus } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';
import DashboardLayout from '@/components/DashboardLayout';

export default async function AdminPage() {
  const user = await getSessionUser();
  const isAdmin = await getAdminStatus();

  if (!user || !isAdmin) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div className="flex-grow py-6 px-4 md:px-8 relative">
        <AdminDashboard />
      </div>
    </DashboardLayout>
  );
}

