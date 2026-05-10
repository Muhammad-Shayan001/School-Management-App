'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type FeeStatus = 'paid' | 'unpaid' | 'pending';

/**
 * Get students with their fee status for Admin/Principal.
 */
export async function getStudentsWithFees(filters?: { class_id?: string; query?: string; fee_status?: FeeStatus }) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized: Only admins can manage fees.' };
  }

  let query = adminClient
    .from('student_profiles')
    .select(`
      user_id,
      roll_number,
      fee_status,
      profiles(full_name, email),
      classes(name, section)
    `)
    .eq('school_id', caller.school_id);

  if (filters?.class_id) query = query.eq('class_id', filters.class_id);
  if (filters?.fee_status) query = query.eq('fee_status', filters.fee_status);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  let result = data;
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((s: any) => 
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q)
    );
  }

  return { data: result, error: null };
}

/**
 * Update a student's fee status.
 */
export async function updateFeeStatus(studentUserId: string, status: FeeStatus) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can update fees.' };
  }

  const { error } = await adminClient
    .from('student_profiles')
    .update({ fee_status: status })
    .eq('user_id', studentUserId);

  if (error) return { error: error.message };

  // Notify the student
  await adminClient.from('notifications').insert({
    user_id: studentUserId,
    title: 'Fee Status Updated',
    message: `Your fee status has been updated to: ${status.toUpperCase()}.`,
    type: 'fee',
    link: '/student',
  });

  revalidatePath('/admin/fees');
  revalidatePath('/teacher/attendance');
  revalidatePath('/student');

  return { success: true };
}

/**
 * Check if a student is eligible for attendance (fees paid).
 */
export async function checkAttendanceEligibility(studentUserId: string) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('student_profiles')
    .select('fee_status')
    .eq('user_id', studentUserId)
    .single();

  if (error || !data) return { eligible: false, status: 'unknown' };

  return { 
    eligible: data.fee_status === 'paid', 
    status: data.fee_status 
  };
}
