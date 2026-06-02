'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { createClient } from '@/app/_lib/supabase/server';

export interface AttendanceNotificationParams {
  studentId: string;
  studentName: string;
  attendanceId: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'pending' | 'rejected';
  attendanceDate: string;
  schoolId: string;
  category: 'attendance_marked' | 'attendance_approved' | 'attendance_updated';
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
  const { studentName, attendanceStatus, attendanceDate, category, time, method } = params;

  const dateObj = new Date(attendanceDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = time || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  switch (category) {
    case 'attendance_marked':
      return {
        title: 'Attendance Marked',
        message: `${studentName}, your attendance has been marked ${attendanceStatus?.toUpperCase()} on ${formattedDate} at ${formattedTime}.`,
      };

    case 'attendance_approved':
      return {
        title: 'Attendance Approved',
        message: `${studentName}, your attendance request has been approved. Status: ${attendanceStatus?.toUpperCase()} on ${formattedDate}.`,
      };

    case 'attendance_updated':
      return {
        title: 'Attendance Updated',
        message: `${studentName}, your attendance status has been updated to ${attendanceStatus?.toUpperCase()} on ${formattedDate} at ${formattedTime}.`,
      };

    default:
      return {
        title: 'Attendance Notification',
        message: `Your attendance was recorded on ${formattedDate} at ${formattedTime}.`,
      };
  }
}

/**
 * Create an attendance notification for a student
 * Called automatically when attendance is marked, approved, or updated
 */
export async function createAttendanceNotification(
  params: AttendanceNotificationParams
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const adminClient = createAdminClient();

    // Get current time for the notification
    const now = new Date().toISOString();

    // Format the notification message
    const { title, message } = formatNotificationMessage(params);

    // Create the notification record
    const { data: notification, error: insertError } = await adminClient
      .from('notifications')
      .insert({
        user_id: params.studentId,
        title,
        message,
        type: 'attendance',
        category: params.category,
        attendance_id: params.attendanceId,
        attendance_status: params.attendanceStatus,
        school_id: params.schoolId,
        is_read: false,
        created_at: now,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating attendance notification:', insertError);
      return { success: false, error: insertError.message };
    }

    if (!notification) {
      return { success: false, error: 'Notification creation returned no data' };
    }

    return { success: true, notificationId: notification.id };
  } catch (err: any) {
    console.error('Unexpected error creating attendance notification:', err);
    return { success: false, error: err.message || 'Failed to create notification' };
  }
}

/**
 * Get attendance notifications for a student
 */
export async function getAttendanceNotifications(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'Unauthorized' };

    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'attendance');

    if (params?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching attendance notifications:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching notifications:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Get unread attendance notification count
 */
export async function getUnreadAttendanceNotificationCount(): Promise<{
  count: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { count: 0, error: 'Unauthorized' };

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'attendance')
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (err: any) {
    console.error('Unexpected error getting unread count:', err);
    return { count: 0, error: err.message };
  }
}

/**
 * Mark attendance notification as read
 */
export async function markAttendanceNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify the notification belongs to the current user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification || notification.user_id !== user.id) {
      return { success: false, error: 'Notification not found or access denied' };
    }

    // Update the notification
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      console.error('Error marking notification as read:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error marking notification as read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark all attendance notifications as read for current user
 */
export async function markAllAttendanceNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'attendance')
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error marking all as read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete an attendance notification
 */
export async function deleteAttendanceNotification(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify the notification belongs to the current user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification || notification.user_id !== user.id) {
      return { success: false, error: 'Notification not found or access denied' };
    }

    // Delete the notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting notification:', err);
    return { success: false, error: err.message };
  }
}
