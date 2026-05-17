import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';

export default async function IndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.status !== 'approved') {
    redirect('/pending');
  }

  const role = user.role as UserRole;
  const targetRoute = DASHBOARD_ROUTES[role] || '/login';
  
  redirect(targetRoute);
}
