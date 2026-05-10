'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { unstable_cache } from 'next/cache';
import { ROLES, DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { sendEmail } from '@/app/_lib/utils/email';

/**
 * Sign up a new user with role-based registration.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as UserRole;
  const phone = formData.get('phone') as string | null;
  const schoolName = formData.get('school_name') as string | null;
  const schoolId = formData.get('school_id') as string | null;
  const classId = formData.get('class_id') as string | null;

  if (!email || !password || !fullName || !role) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  if (role === ROLES.SUPER_ADMIN && email !== superAdminEmail) {
    return { error: 'You are not authorized to register as Super Admin.' };
  }

  const isSuperAdmin = email === superAdminEmail && role === ROLES.SUPER_ADMIN;
  const status = isSuperAdmin ? 'approved' : 'pending';

  const adminClient = createAdminClient();
  
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      status,
    },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: 'Failed to create user account.' };

  await supabase.auth.signInWithPassword({ email, password });
  
  const profilePromise = adminClient.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    phone,
    role,
    status,
    school_id: schoolId || null,
  });

  const extraPromises = [];
  if (role === ROLES.TEACHER && schoolId) {
    extraPromises.push(adminClient.from('teacher_profiles').insert({ user_id: authData.user.id, school_id: schoolId }));
  }
  if (role === ROLES.STUDENT && schoolId) {
    extraPromises.push(adminClient.from('student_profiles').insert({ user_id: authData.user.id, school_id: schoolId, class_id: classId || null }));
  }

  const [profileResult] = await Promise.all([profilePromise, ...extraPromises]);
  if (profileResult.error) return { error: 'Failed to create profile: ' + profileResult.error.message };

  if (role === ROLES.ADMIN && schoolName) {
    const { data: schoolData, error: schoolError } = await adminClient.from('schools').insert({ name: schoolName, admin_id: authData.user.id, email }).select('id').single();
    if (!schoolError && schoolData) {
      await adminClient.from('profiles').update({ school_id: schoolData.id }).eq('id', authData.user.id);
      const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
      const defaultClasses = CLASS_NAMES.map(name => ({ name, school_id: schoolData.id, section: 'A' }));
      await adminClient.from('classes').insert(defaultClasses);
    }
  }

  if (isSuperAdmin) {
    await adminClient.from('notifications').insert({ user_id: authData.user.id, title: 'Welcome!', message: 'Your Super Admin account has been created successfully.', type: 'approval' });
    redirect(DASHBOARD_ROUTES.super_admin);
  }

  // Handle Notifications (simplified for brevity)
  let link = '';
  if (role === ROLES.ADMIN) link = '/super-admin/approvals';
  else if (role === ROLES.TEACHER) link = '/admin/teachers';
  else if (role === ROLES.STUDENT) link = '/teacher/students';

  redirect('/pending');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password are required.' };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Invalid email or password.' };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile) return { error: 'User profile not found.' };

  if (profile.status === 'pending') { await supabase.auth.signOut(); redirect('/pending'); }
  if (profile.status === 'rejected') { await supabase.auth.signOut(); return { error: 'Your account has been rejected.' }; }

  redirect(DASHBOARD_ROUTES[profile.role as UserRole] || '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Get the current authenticated user's profile.
 * Wrapped in unstable_cache for production performance.
 */
export const getCurrentUser = unstable_cache(
  async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return profile;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },
  ['current-user'],
  { revalidate: 60, tags: ['auth'] }
);

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('id, full_name').eq('email', email).single();
  if (!profile) return { error: 'No account found.' };

  const newPassword = Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-6);
  await adminClient.auth.admin.updateUserById(profile.id, { password: newPassword });

  await sendEmail({
    to: email,
    subject: 'Your New Password',
    text: `Your new password is: ${newPassword}`,
    html: `<p>Your new password is: <strong>${newPassword}</strong></p>`
  });

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters.' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}
