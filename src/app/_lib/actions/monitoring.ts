'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { unstable_cache } from 'next/cache';

/**
 * Get comprehensive analytics for the Principal/Admin dashboard.
 * Optimized with parallel fetching and caching.
 */
export const getAdminAnalytics = unstable_cache(
  async (schoolId: string) => {
    const adminClient = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: totalClasses },
      { count: totalSubjects },
      { count: attendanceToday },
      { count: absentToday },
      { count: pendingAssignments },
      { count: examCount },
      { count: announcementCount }
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher'),
      adminClient.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      adminClient.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      adminClient.from('attendance').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('date', today).eq('status', 'present'),
      adminClient.from('attendance').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('date', today).eq('status', 'absent'),
      adminClient.from('assignments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).gt('deadline', new Date().toISOString()),
      adminClient.from('exam_schedules').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      adminClient.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)
    ]);

    // Fetch fee status counts (assuming fee_status is in student_profiles)
    let feesPending = 0;
    try {
      const { data: feeData, error: feeErr } = await adminClient
        .from('student_profiles')
        .select('fee_status')
        .eq('school_id', schoolId);

      if (!feeErr && feeData && feeData.length > 0) {
        feesPending = feeData.filter(s => s.fee_status !== 'paid').length || 0;
      } else {
        // Fallback: if student_profiles rows aren't present or don't have school_id,
        // derive from profiles.role='student' for this school and then fetch student_profiles by user_id
        const { data: studentAccounts } = await adminClient
          .from('profiles')
          .select('id')
          .eq('role', 'student')
          .eq('school_id', schoolId);

        const userIds = (studentAccounts || []).map((p: any) => p.id);
        if (userIds.length > 0) {
          const { data: spData } = await adminClient
            .from('student_profiles')
            .select('fee_status')
            .in('user_id', userIds);
          feesPending = (spData || []).filter((s: any) => s.fee_status !== 'paid').length || 0;
        } else {
          feesPending = 0;
        }
      }
    } catch (e) {
      feesPending = 0;
    }

    return {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      totalClasses: totalClasses || 0,
      totalSubjects: totalSubjects || 0,
      attendanceToday: attendanceToday || 0,
      absentToday: absentToday || 0,
      pendingAssignments: pendingAssignments || 0,
      feesPending,
      examCount: examCount || 0,
      announcementCount: announcementCount || 0,
      attendanceRate: totalStudents ? Math.round(((attendanceToday || 0) / totalStudents) * 100) : 0
    };
  },
  ['admin-analytics'],
  { revalidate: 300, tags: ['monitoring'] }
);

/**
 * Get recent activity logs for the dashboard.
 */
export async function getRecentActivity(schoolId: string) {
  const adminClient = createAdminClient();
  
  // Combine recent attendance, assignments, and results
  const [attendance, assignments, results] = await Promise.all([
    adminClient.from('attendance').select('*, profiles(full_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
    adminClient.from('assignments').select('*, profiles:teacher_id(full_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
    adminClient.from('results').select('*, profiles:student_id(full_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5)
  ]);

  const activities = [
    ...(attendance.data || []).map(a => ({ type: 'attendance', title: `${a.profiles?.full_name} marked ${a.status}`, time: a.created_at })),
    ...(assignments.data || []).map(as => ({ type: 'assignment', title: `New assignment: ${as.title}`, time: as.created_at })),
    ...(results.data || []).map(r => ({ type: 'result', title: `Result uploaded for ${r.profiles?.full_name}`, time: r.created_at }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return activities;
}
