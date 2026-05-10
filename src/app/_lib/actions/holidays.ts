'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addHoliday(params: {
  date: string;
  title: string;
  type: 'everyone' | 'students' | 'teachers';
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Only Principals/Admins can manage holidays' };
  }

  const { error } = await adminClient
    .from('holidays')
    .upsert({
      school_id: profile.school_id,
      date: params.date,
      title: params.title,
      type: params.type,
      created_by: user.id
    });

  if (error) return { error: error.message };

  revalidatePath('/admin/attendance');
  revalidatePath('/teacher/attendance');
  revalidatePath('/student/attendance');
  return { success: true };
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  
  revalidatePath('/admin/attendance');
  return { success: true };
}

export async function getHolidays() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  const { data } = await supabase
    .from('holidays')
    .select('*')
    .eq('school_id', profile?.school_id)
    .order('date', { ascending: false });

  return { data: data || [] };
}

/**
 * Check if a date is a holiday or Sunday for a specific role
 */
export async function checkOffDay(dateStr: string, role: 'student' | 'teacher', schoolId: string) {
  const date = new Date(dateStr);
  
  // 1. Check if it's Sunday (0 = Sunday)
  if (date.getUTCDay() === 0) {
    return { isOff: true, reason: 'Sunday' };
  }

  // 2. Check database for scheduled holidays
  const supabase = await createClient();
  const { data: holiday } = await supabase
    .from('holidays')
    .select('*')
    .eq('school_id', schoolId)
    .eq('date', dateStr)
    .single();

  if (holiday) {
    if (holiday.type === 'everyone' || 
       (holiday.type === 'students' && role === 'student') || 
       (holiday.type === 'teachers' && role === 'teacher')) {
      return { isOff: true, reason: holiday.title };
    }
  }

  return { isOff: false };
}
