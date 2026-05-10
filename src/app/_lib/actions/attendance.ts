'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Creates an attendance record. 
 * If method is 'qr', it defaults to 'pending'.
 * If method is 'manual', it is created as 'approved' (marked by teacher).
 */
export async function markAttendance(params: {
  userId: string;
  role: 'student' | 'teacher';
  status?: 'pending' | 'present' | 'absent' | 'late';
  method: 'manual' | 'qr';
  date?: string;
  classId?: string;
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user: caller } } = await supabase.auth.getUser();

  if (!caller) return { error: 'Unauthorized' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', caller.id)
    .single();

  if (!callerProfile) return { error: 'Permission denied' };

  // SECURITY CHECK: If teacher, verify they are a class teacher and the student is in their class
  if (callerProfile.role === 'teacher') {
    if (params.role === 'student') {
      const { data: teacherData } = await adminClient
        .from('teacher_profiles')
        .select('class_id, is_class_teacher')
        .eq('user_id', caller.id)
        .single();

      if (!teacherData?.is_class_teacher || teacherData.class_id !== params.classId) {
        return { error: 'Unauthorized: You can only mark attendance for your assigned class.' };
      }
    } else if (params.role === 'teacher' && caller.id !== params.userId) {
      return { error: 'Unauthorized: You can only mark your own attendance.' };
    }
  }

  const attendanceDate = params.date || new Date().toISOString().split('T')[0];
  
  // Default status logic
  let finalStatus = params.status;
  if (!finalStatus) {
    finalStatus = params.method === 'qr' ? 'pending' : 'present';
  }

  // Check for existing record correctly
  const { data: existing, error: fetchError } = await adminClient
    .from('attendance')
    .select('id, status')
    .eq('user_id', params.userId)
    .eq('date', attendanceDate)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };

  if (existing && params.method === 'qr' && existing.status !== 'rejected') {
    return { error: 'Request already exists or is approved' };
  }

  const attendanceData = {
    user_id: params.userId,
    role: params.role,
    status: finalStatus,
    method: params.method,
    date: attendanceDate,
    marked_by: caller.id,
    school_id: callerProfile.school_id,
    class_id: params.classId || null,
    approved_by: finalStatus === 'present' ? caller.id : null
  };

  let error;
  if (existing) {
    // UPDATE existing record
    const { error: updateErr } = await adminClient
      .from('attendance')
      .update(attendanceData)
      .eq('id', existing.id);
    error = updateErr;
  } else {
    // INSERT new record
    const { error: insertErr } = await adminClient
      .from('attendance')
      .insert(attendanceData);
    error = insertErr;
  }

  if (error) return { error: error.message };

  revalidatePath('/admin/attendance');
  revalidatePath('/teacher/attendance');
  return { success: true };
}

/**
 * Approve a pending attendance request
 */
export async function approveAttendance(attendanceId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await adminClient
    .from('attendance')
    .update({ 
      status: 'present',
      approved_by: user.id 
    })
    .eq('id', attendanceId);

  if (error) return { error: error.message };

  revalidatePath('/admin/attendance');
  revalidatePath('/teacher/attendance');
  return { success: true };
}

/**
 * Reject a pending attendance request
 */
export async function rejectAttendance(attendanceId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await adminClient
    .from('attendance')
    .update({ 
      status: 'rejected',
      approved_by: user.id 
    })
    .eq('id', attendanceId);

  if (error) return { error: error.message };

  revalidatePath('/admin/attendance');
  revalidatePath('/teacher/attendance');
  return { success: true };
}

/**
 * Get school-wide attendance with profile details
 */
export async function getSchoolAttendance(date: string, filters?: { status?: string; classId?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: null, error: 'No school associated' };

  let query = supabase
    .from('attendance')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        student_profiles(roll_number),
        teacher_profiles(teacher_id)
      )
    `)
    .eq('school_id', profile.school_id)
    .eq('date', date)
    .order('created_at', { ascending: false });

  // STRICT PERMISSION ENFORCEMENT: Teachers can ONLY see their assigned class
  if (profile.role === 'teacher') {
    const { data: teacherData } = await createAdminClient()
      .from('teacher_profiles')
      .select('class_id')
      .eq('user_id', user.id)
      .single();
      
    if (!teacherData?.class_id) {
      // Teacher has no class assigned, return empty immediately
      return { data: [], error: null };
    }
    
    // Force the query to only return records for this teacher's class
    query = query.eq('class_id', teacherData.class_id);
  } else if (filters?.classId) {
    // For admins/super_admins who pass a filter
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }


  try {
    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('getSchoolAttendance Error:', err);
    return { data: [], error: 'Failed to fetch attendance logs. Please try again.' };
  }
}

/**
 * Get attendance records for a specific user.
 * Uses admin client to bypass RLS for reliable data fetching.
 * Security: validates caller is the same user or an admin/teacher.
 */
export async function getUserAttendance(userId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Security: verify the caller
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) return { data: [], error: 'Unauthorized' };

  // Students can only view their own attendance
  if (caller.id !== userId) {
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role === 'student') {
      return { data: [], error: 'Permission denied' };
    }
  }

  try {
    const { data, error } = await adminClient
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('getUserAttendance Error:', err);
    return { data: [], error: err.message || 'Failed to fetch attendance records' };
  }
}

/**
 * Securely fetch students for the logged-in teacher's assigned class.
 * Enforces class isolation explicitly.
 */
export async function getAttendanceStudents() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'teacher') return { data: [], error: 'Unauthorized' };

  const { data: teacherProfile } = await adminClient
    .from('teacher_profiles')
    .select('class_id')
    .eq('user_id', user.id)
    .single();

  if (!teacherProfile?.class_id) {
    return { data: [], error: null }; // No class assigned
  }

  // Fetch only students in the assigned class
  const { data: studentProfiles } = await adminClient
    .from('student_profiles')
    .select('user_id, roll_number')
    .eq('class_id', teacherProfile.class_id);

  const userIds = studentProfiles?.map((sp: any) => sp.user_id) || [];

  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)
    .order('full_name', { ascending: true });

  const merged = profiles?.map(p => ({
    ...p,
    roll_number: studentProfiles?.find((sp: any) => sp.user_id === p.id)?.roll_number
  })) || [];

  return { data: merged, error: null };
}

/**
 * Finalize attendance for a specific date:
 * - Converts any 'pending' status to 'absent'
 * - Marks all unmarked students in the class as 'absent'
 */
export async function finalizeDailyAttendance(date: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'teacher') return { error: 'Only teachers can finalize attendance' };

  const { data: teacherProfile } = await adminClient
    .from('teacher_profiles')
    .select('class_id, is_class_teacher')
    .eq('user_id', user.id)
    .single();

  if (!teacherProfile?.is_class_teacher || !teacherProfile.class_id) {
    return { error: 'Only class teachers can finalize attendance' };
  }

  // 1. Get all students in the class
  const { data: studentProfiles } = await adminClient
    .from('student_profiles')
    .select('user_id')
    .eq('class_id', teacherProfile.class_id);

  const studentIds = studentProfiles?.map((sp: any) => sp.user_id) || [];
  if (studentIds.length === 0) return { success: true };

  // 2. Get existing attendance for this class and date
  const { data: existingRecords } = await adminClient
    .from('attendance')
    .select('id, user_id, status')
    .eq('date', date)
    .eq('class_id', teacherProfile.class_id);

  const existingMap = new Map((existingRecords || []).map((r: any) => [r.user_id, r]));

  const updates = [];
  const inserts = [];

  for (const studentId of studentIds) {
    const record = existingMap.get(studentId);
    if (!record) {
      // Missing record -> mark as absent
      inserts.push({
        user_id: studentId,
        role: 'student',
        status: 'absent',
        method: 'manual',
        date: date,
        marked_by: user.id,
        school_id: profile.school_id,
        class_id: teacherProfile.class_id,
        approved_by: user.id
      });
    } else if (record.status === 'pending') {
      // Pending record -> mark as absent
      updates.push(
        adminClient
          .from('attendance')
          .update({ status: 'absent', approved_by: user.id })
          .eq('id', record.id)
      );
    }
  }

  // Execute inserts
  if (inserts.length > 0) {
    const { error: insertError } = await adminClient.from('attendance').insert(inserts);
    if (insertError) return { error: insertError.message };
  }

  // Execute updates
  if (updates.length > 0) {
    await Promise.all(updates);
  }

  revalidatePath('/admin/attendance');
  revalidatePath('/teacher/attendance');
  return { success: true };
}
