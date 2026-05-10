'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { UserRole, UserStatus } from '@/app/_lib/utils/constants';

/**
 * Get all users, optionally filtered by role and/or status.
 */
export async function getUsers(filters?: { role?: UserRole; status?: UserStatus; school_id?: string; class_id?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  // Fetch caller profile to verify permissions
  const { data: caller } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin', 'teacher'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized' };
  }

  // Teachers can only view students
  if (caller.role === 'teacher' && filters?.role !== 'student') {
    return { data: null, error: 'Unauthorized: Teachers can only view students.' };
  }

  // Use admin client to bypass RLS for fetching the user list
  const adminClient = createAdminClient();
  let query = adminClient.from('profiles').select('*').order('created_at', { ascending: false });

  if (filters?.role) query = query.eq('role', filters.role);
  if (filters?.status) query = query.eq('status', filters.status);
  
  // Enforce school isolation for school admins and teachers
  if (caller.role === 'admin' || caller.role === 'teacher') {
    if (!caller.school_id) return { data: [], error: null };
    query = query.eq('school_id', caller.school_id);
  } else if (filters?.school_id) {
    query = query.eq('school_id', filters.school_id);
  }

  // Add class_id filtering if requested (requires joining/subquerying student_profiles)
  if (filters?.class_id) {
    const { data: classStudents } = await adminClient
      .from('student_profiles')
      .select('user_id')
      .eq('class_id', filters.class_id);
      
    const userIds = classStudents?.map(cs => cs.user_id) || [];
    
    if (userIds.length > 0) {
      query = query.in('id', userIds);
    } else {
      // If there are no students in the class, return empty immediately
      return { data: [], error: null };
    }
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Approve a user — sets status to 'approved'.
 */
export async function approveUser(userId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };

  // Update auth metadata for faster middleware checks
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'approved' }
  });

  // Fetch the user to send them a notification
  const { data: user } = await adminClient
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  if (user) {
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Account Approved! 🎉',
      message: `Your ${user.role} account has been approved. You can now log in and access your dashboard.`,
      type: 'approval',
    });
  }

  revalidatePath('/super-admin/approvals');
  revalidatePath('/admin/teachers');
  revalidatePath('/admin/students');

  return { error: null };
}

/**
 * Reject a user — sets status to 'rejected'.
 */
export async function rejectUser(userId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };

  // Update auth metadata
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'rejected' }
  });

  // Notify the user
  const { data: user } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (user) {
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Account Not Approved',
      message: 'Your account registration has been reviewed and was not approved. Please contact the administrator for more information.',
      type: 'approval',
    });
  }

  revalidatePath('/super-admin/approvals');
  revalidatePath('/admin/teachers');
  revalidatePath('/admin/students');

  return { error: null };
}

/**
 * Get user count statistics by role and status.
 */
export async function getUserStats() {
  const adminClient = createAdminClient();

  const { data: profiles } = await adminClient.from('profiles').select('role, status');

  if (!profiles) return { total: 0, admins: 0, teachers: 0, students: 0, pending: 0 };

  return {
    total: profiles.length,
    admins: profiles.filter((p) => p.role === 'admin').length,
    teachers: profiles.filter((p) => p.role === 'teacher').length,
    students: profiles.filter((p) => p.role === 'student').length,
    pending: profiles.filter((p) => p.status === 'pending').length,
  };
}
