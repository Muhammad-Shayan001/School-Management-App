import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { createAttendanceNotification } from '@/app/_lib/actions/attendance-notifications';

// This endpoint can be triggered by a cron job (e.g. Vercel Cron or external service)
// It processes all schools and marks unmarked students as ABSENT for today.
export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Optional: Add authorization header check for cron jobs here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    console.log(`[Auto-Absent] Starting attendance finalization for ${today}...`);

    // 1. Get all active schools
    const { data: schools } = await adminClient.from('schools').select('id').eq('is_active', true);
    if (!schools || schools.length === 0) {
      return NextResponse.json({ success: true, message: 'No active schools found' });
    }

    let totalMarked = 0;

    // Process each school
    for (const school of schools) {
      // 2. Get all students in this school
      const { data: students } = await adminClient
        .from('student_profiles')
        .select('user_id, class_id, campus_id')
        .eq('school_id', school.id);
        
      if (!students || students.length === 0) continue;

      // 3. Get existing attendance for this school today
      const { data: existingRecords } = await adminClient
        .from('attendance')
        .select('id, user_id, status')
        .eq('date', today)
        .eq('school_id', school.id);
        
      const existingMap = new Map((existingRecords || []).map((r: any) => [r.user_id, r]));

      const inserts = [];
      const updates = [];
      const notificationsToCreate: any[] = [];

      for (const sp of students) {
        const studentId = sp.user_id;
        const record = existingMap.get(studentId);
        
        if (!record) {
          inserts.push({
            user_id: studentId,
            role: 'student',
            status: 'absent',
            method: 'system',
            date: today,
            school_id: school.id,
            class_id: sp.class_id,
            campus_id: sp.campus_id || null,
          });
          notificationsToCreate.push({ studentId, finalStatus: 'absent', class_id: sp.class_id });
        } else if (record.status === 'pending') {
          updates.push(
            adminClient
              .from('attendance')
              .update({ status: 'absent', method: 'system' })
              .eq('id', record.id)
          );
          notificationsToCreate.push({ studentId, finalStatus: 'absent', class_id: sp.class_id });
        }
      }

      // Execute inserts
      let insertedIds: string[] = [];
      if (inserts.length > 0) {
        const { data: insertedRecords, error: insertError } = await adminClient
          .from('attendance')
          .insert(inserts)
          .select('id, user_id');
        if (insertError) console.error('[Auto-Absent] Insert error:', insertError);
        else if (insertedRecords) insertedIds.push(...insertedRecords.map((r: any) => r.id));
      }

      // Execute updates
      if (updates.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < updates.length; i += chunkSize) {
           await Promise.all(updates.slice(i, i + chunkSize));
        }
      }

      totalMarked += inserts.length + updates.length;

      // Send notifications
      if (notificationsToCreate.length > 0) {
        try {
          const studentIds = students.map(sp => sp.user_id);
          const { data: profiles } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds);
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

          const notificationPromises = notificationsToCreate.map((req, idx) => {
            const attendanceId = insertedIds[idx] || existingMap.get(req.studentId)?.id;
            if (attendanceId) {
              const studentName = profileMap.get(req.studentId) || 'Student';
              return createAttendanceNotification({
                studentId: req.studentId,
                studentName,
                attendanceId,
                attendanceStatus: req.finalStatus,
                attendanceDate: today,
                schoolId: school.id,
                category: 'attendance_updated',
                method: 'system',
                time: timeStr,
              });
            }
            return Promise.resolve();
          });
          
          const chunkSize = 50;
          for (let i = 0; i < notificationPromises.length; i += chunkSize) {
            await Promise.all(notificationPromises.slice(i, i + chunkSize));
          }
        } catch (err) {
          console.error('[Auto-Absent] Error sending notifications:', err);
        }
      }
    }

    console.log(`[Auto-Absent] Successfully marked ${totalMarked} students absent across all schools.`);
    return NextResponse.json({ success: true, markedCount: totalMarked });
  } catch (error: any) {
    console.error('[Auto-Absent] Finalization failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
