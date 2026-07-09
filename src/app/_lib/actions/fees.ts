'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type FeeStatus = 'paid' | 'unpaid' | 'pending';

/**
 * Get students with their fee status for Admin/Principal.
 */
export async function getStudentsWithFees(filters?: { class_id?: string; query?: string; fee_status?: FeeStatus; campus_id?: string }) {
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
    `);

  // Multi-campus logic: 
  // 1. If campus_id is explicitly provided (from UI switcher), use it
  // 2. Otherwise, if caller has a fixed school_id, use that
  if (filters?.campus_id) {
    query = query.eq('school_id', filters.campus_id);
  } else if (caller.school_id) {
    query = query.eq('school_id', caller.school_id);
  } else if (caller.role !== 'super_admin') {
    // If admin has no fixed school_id and didn't provide one, they might be multi-campus
    // but the UI should have passed one. As a fallback, we fetch their first campus.
    const { data: adminCampuses } = await adminClient
      .from('admin_campuses')
      .select('school_id')
      .eq('admin_id', user.id)
      .limit(1)
      .single();
    if (adminCampuses) {
      query = query.eq('school_id', adminCampuses.school_id);
    }
  }

  if (filters?.class_id) query = query.eq('class_id', filters.class_id);
  if (filters?.fee_status) query = query.eq('fee_status', filters.fee_status);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  let result = data || [];

  // If no rows found (possible schema drift or missing school_id on student_profiles),
  // fall back to profiles.role='student' for this school and join by user_id.
  if ((!result || result.length === 0) && caller.school_id) {
    const { data: studentAccounts } = await adminClient
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone, status')
      .eq('role', 'student')
      .eq('school_id', caller.school_id);

    const userIds = (studentAccounts || []).map((p: any) => p.id);
    if (userIds.length > 0) {
      // fetch student_profiles for these user ids
      const { data: spData, error: spErr } = await adminClient
        .from('student_profiles')
        .select('user_id, roll_number, fee_status, class_id, campus_id, section')
        .in('user_id', userIds);

      let spMap: Record<string, any> = {};
      const classIds: string[] = [];
      if (!spErr && spData) {
        spData.forEach((s: any) => {
          spMap[s.user_id] = s;
          if (s.class_id) classIds.push(s.class_id);
        });
      }

      // Fetch class details (name, section) for any referenced class_ids so we can
      // return the same shape as the primary query (classes: [{ name, section }])
      let classMap: Record<string, any> = {};
      if (classIds.length > 0) {
        const { data: classRows } = await adminClient
          .from('classes')
          .select('id, name, section')
          .in('id', classIds);
        (classRows || []).forEach((c: any) => { classMap[c.id] = c; });
      }

      result = (studentAccounts || []).map((p: any) => {
        const sp = spMap[p.id] || {};
        const cls = sp.class_id ? (classMap[sp.class_id] ? [classMap[sp.class_id]] : []) : [];
        return {
          user_id: p.id,
          roll_number: sp.roll_number || null,
          fee_status: sp.fee_status || 'unpaid',
          // Match primary query shape: profiles comes back as an array of objects
          profiles: [{ full_name: p.full_name, email: p.email }],
          // classes should be an array (possibly empty) with name/section
          classes: cls,
        };
      });
    }
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((s: any) => 
      (s.profiles?.full_name || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toString().toLowerCase().includes(q)
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
