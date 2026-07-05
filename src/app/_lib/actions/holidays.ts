'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getPakistanDayOfWeek } from '@/app/_lib/utils/format';

function isMissingHolidayTableError(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.includes("public.holidays") || error?.message?.includes('schema cache'));
}

function holidaySetupHint() {
  return 'Holiday storage is not initialized yet. Run fix_all_missing_tables.sql or setup_holidays.sql in Supabase, then reload the schema cache.';
}

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

  if (!profile.school_id) {
    return { error: 'School not found for the current admin account.' };
  }

  const { error } = await adminClient
    .from('holidays')
    .upsert({
      school_id: profile.school_id,
      date: params.date,
      title: params.title.trim(),
      type: params.type,
      created_by: user.id
    }, {
      onConflict: 'school_id,date'
    });

  if (error) {
    console.error('Holiday insert error:', error);
    if (isMissingHolidayTableError(error)) {
      return { error: holidaySetupHint() };
    }
    return { error: error.message };
  }

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

  if (error) {
    if (isMissingHolidayTableError(error)) {
      return { error: holidaySetupHint() };
    }
    return { error: error.message };
  }
  
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
  // Use Pakistan timezone so Sunday/Monday logic matches the actual school day in Karachi
  const dayOfWeek = getPakistanDayOfWeek(dateStr);

  if (dayOfWeek === 0) {
    return { isOff: true, reason: 'Sunday' };
  }

  // 2. Check database for scheduled holidays
  const supabase = await createClient();
  const { data: holiday, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('school_id', schoolId)
    .eq('date', dateStr)
    .single();

  if (error && isMissingHolidayTableError(error)) {
    return { isOff: false };
  }

  if (holiday) {
    if (holiday.type === 'everyone' || 
       (holiday.type === 'students' && role === 'student') || 
       (holiday.type === 'teachers' && role === 'teacher')) {
      return { isOff: true, reason: holiday.title };
    }
  }

  return { isOff: false };
}
