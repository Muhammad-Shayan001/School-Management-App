'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { markAttendance } from './attendance';

/**
 * Mark attendance using the UUID.
 * Updated: Now creates a PENDING request for approval.
 */
export async function markAttendanceByUid(uid: string) {
  const adminClient = createAdminClient();

  try {
    // Fetch profile and role-specific class info
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select(`
        id, 
        full_name, 
        role,
        student_profiles(class_id),
        teacher_profiles(user_id)
      `)
      .eq('id', uid)
      .single();

    if (error || !profile) return { success: false, message: 'User not found in system' };
    
    if (profile.role !== 'student' && profile.role !== 'teacher') {
         return { success: false, message: `Role ${profile.role} cannot mark attendance` };
    }

    // Extract class_id for students to allow class teacher filtering
    const classId = profile.role === 'student' ? (profile.student_profiles as any)?.[0]?.class_id : null;

    const result = await markAttendance({
      userId: profile.id,
      role: profile.role as any,
      status: 'pending', // IMPORTANT: QR scans are always pending
      method: 'qr',
      classId: classId
    });

    if (result.error) {
      return { success: false, message: result.error };
    }

    return { 
      success: true, 
      message: `Request sent for ${profile.full_name}. Awaiting approval.` 
    };
  } catch (error) {
    return { success: false, message: 'Internal server error' };
  }
}
