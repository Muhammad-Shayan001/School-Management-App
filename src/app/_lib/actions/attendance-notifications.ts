'use server';

import { createNotification } from './notifications';

export interface AttendanceNotificationParams {
  studentId: string;
  studentName: string;
  attendanceId: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'pending' | 'rejected';
  attendanceDate: string;
  schoolId: string;
  category: 'attendance_marked' | 'attendance_approved' | 'attendance_updated' | 'attendance_approval_needed';
  method?: 'manual' | 'qr' | 'camera' | 'scanner';
  time?: string;
}

/**
 * Format attendance notification message based on category and status
 */
function formatNotificationMessage(params: AttendanceNotificationParams): {
  title: string;
  message: string;
} {
  const { studentName, attendanceStatus, attendanceDate, category, time } = params;

  const dateObj = new Date(attendanceDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Karachi',
  });

  const formattedTime = time || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi',
  });

  switch (category) {
    case 'attendance_marked':
      return {
        title: 'Attendance Marked Successfully',
        message: `${studentName} has been marked ${attendanceStatus?.charAt(0).toUpperCase()}${attendanceStatus?.slice(1)} today at ${formattedTime}.`,
      };

    case 'attendance_approved':
      return {
        title: 'Attendance Approved',
        message: `${studentName}, your attendance request has been approved. Status: ${attendanceStatus?.toUpperCase()} on ${formattedDate}.`,
      };

    case 'attendance_updated':
      return {
        title: 'Attendance Updated',
        message: `${studentName}, your attendance status has been updated to ${attendanceStatus?.toUpperCase()} on ${formattedDate}.`,
      };

    case 'attendance_approval_needed':
      return {
        title: 'Attendance Approval Needed',
        message: `${studentName} has scanned their ID for attendance, but their fee status is unpaid. Please approve or reject for ${formattedDate}.`,
      };

    default:
      return {
        title: 'Attendance Notification',
        message: `Your attendance was recorded on ${formattedDate}.`,
      };
  }
}

/**
 * Create an attendance notification for a student.
 * Delegates to the unified createNotification action to trigger FCM push alerts.
 */
export async function createAttendanceNotification(
  params: AttendanceNotificationParams
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const { title, message } = formatNotificationMessage(params);

    const result = await createNotification({
      userId: params.studentId,
      title,
      message,
      type: 'attendance',
      category: params.category,
      attendanceId: params.attendanceId,
      attendanceStatus: params.attendanceStatus,
      schoolId: params.schoolId,
      priority: params.category === 'attendance_approval_needed' ? 'high' : 'normal',
      link: params.category === 'attendance_approval_needed' ? '/admin/attendance' : '/student/notifications',
    });

    return result;
  } catch (err: any) {
    console.error('❌ Unexpected error in createAttendanceNotification wrapper:', err);
    return { success: false, error: err.message || 'Failed to create notification' };
  }
}
