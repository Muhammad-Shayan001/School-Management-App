'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { markAttendance } from './attendance';

/**
 * Mark attendance using the UUID.
 * Updated: Now creates a PENDING request for approval.
 */
export async function markAttendanceByUid(uid: string) {
  const adminClient = createAdminClient();
  let resolvedUid = uid.trim();

  try {
    // 1. Handle prefixed QR codes
    if (resolvedUid.startsWith('PRINCIPAL_')) {
      resolvedUid = resolvedUid.replace('PRINCIPAL_', '');
    }

    // 2. Handle Student ID format (e.g. STD-2026-001)
    if (resolvedUid.startsWith('STD-')) {
      const { data: sp } = await adminClient
        .from('student_profiles')
        .select('user_id')
        .eq('student_id', resolvedUid)
        .maybeSingle();
      if (sp?.user_id) {
        resolvedUid = sp.user_id;
      } else {
        return { success: false, message: `Student ID ${resolvedUid} not found` };
      }
    }
    // 3. Handle Teacher ID format (e.g. TCH-2026-001)
    else if (resolvedUid.startsWith('TCH-')) {
      const { data: tp } = await adminClient
        .from('teacher_profiles')
        .select('user_id')
        .eq('teacher_id', resolvedUid)
        .maybeSingle();
      if (tp?.user_id) {
        resolvedUid = tp.user_id;
      } else {
        return { success: false, message: `Teacher ID ${resolvedUid} not found` };
      }
    }

    // 4. Fetch profile and role-specific class info using resolved UUID
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select(`
        id, 
        full_name, 
        role,
        student_profiles(class_id),
        teacher_profiles(user_id)
      `)
      .eq('id', resolvedUid)
      .maybeSingle();

    if (error || !profile) return { success: false, message: 'User not found in system' };

    if (profile.role !== 'student' && profile.role !== 'teacher') {
      return { success: false, message: `Role ${profile.role} cannot mark attendance` };
    }

    // Extract class_id for students to allow class teacher filtering
    const classId = profile.role === 'student' ? (profile.student_profiles as any)?.[0]?.class_id : null;

    const result = await markAttendance({
      userId: profile.id,
      role: profile.role as any,
      method: 'qr',
      classId: classId
    });

    if (result.error) {
      return { success: false, message: result.error };
    }

    if (result.status === 'already_marked') {
      return {
        success: true,
        status: 'already_marked',
        message: `Already Marked: ${profile.full_name}`
      };
    }

    if (result.status === 'pending') {
      return {
        success: true,
        status: 'pending',
        message: `Sent for approval: ${profile.full_name}`
      };
    }

    return {
      success: true,
      status: 'present',
      message: `Present: ${profile.full_name}`
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Internal server error' };
  }
}
