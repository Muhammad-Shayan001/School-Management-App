'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { createClient } from '@/app/_lib/supabase/server';
import { messaging } from '@/app/_lib/firebase/admin';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string; // 'attendance' | 'assignment' | 'result' | 'fee' | 'exam' | 'holiday' | 'announcement' | 'system' | 'profile'
  role?: string;
  studentId?: string;
  teacherId?: string;
  priority?: 'normal' | 'high';
  link?: string;
  schoolId?: string;
  category?: string; // e.g., 'attendance_marked', 'attendance_approved', etc.
  attendanceId?: string;
  attendanceStatus?: string;
  device?: string;
  platform?: string;
  createdBy?: string;
}

/**
 * Creates a notification in the database and sends a push notification via FCM.
 * Gracefully degrades if Firebase is not configured or fails.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const adminClient = createAdminClient();
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const timeString = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi',
    });

    // 1. Insert notification into Supabase database (bypasses RLS)
    const { data: notification, error: insertError } = await adminClient
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        role: params.role || null,
        student_id: params.studentId || null,
        teacher_id: params.teacherId || null,
        priority: params.priority || 'normal',
        status: 'sent',
        is_read: false,
        read_status: false,
        link: params.link || null,
        created_at: now,
        created_date: today,
        created_time: timeString,
        device: params.device || 'web',
        platform: params.platform || 'web',
        created_by: params.createdBy || null,
        attendance_id: params.attendanceId || null,
        category: params.category || 'general',
        attendance_status: params.attendanceStatus || null,
        school_id: params.schoolId || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Error inserting notification into database:', insertError);
      return { success: false, error: insertError.message };
    }

    if (!notification) {
      return { success: false, error: 'Database insert returned empty result.' };
    }

    // 2. Fetch the target user's active FCM tokens
    const { data: tokenRecords, error: tokenError } = await adminClient
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', params.userId);

    if (tokenError) {
      console.error('⚠️ Error fetching user FCM tokens:', tokenError.message);
    }

    const tokens = tokenRecords?.map((t) => t.token) || [];

    // 3. Send Push Notification via Firebase if service is initialized and tokens exist
    if (messaging && tokens.length > 0) {
      try {
        const payload = {
          tokens,
          notification: {
            title: params.title,
            body: params.message,
          },
          data: {
            link: params.link || '',
            type: params.type || 'general',
            notificationId: notification.id,
          },
          android: {
            priority: (params.priority === 'high' ? 'high' : 'normal') as any,
            notification: {
              sound: 'default',
              priority: (params.priority === 'high' ? 'high' : 'default') as any,
              channelId: 'school_notifications',
              icon: 'ic_stat_notification', // Custom notification icon
            },
          },
          webpush: {
            notification: {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              click_action: params.link || '/',
            },
          },
        };

        const response = await messaging.sendEachForMulticast(payload);
        console.log(`📤 FCM Multicast send results: ${response.successCount} success, ${response.failureCount} failure`);

        // 4. Cleanup expired/invalid tokens from the database
        if (response.failureCount > 0) {
          const tokensToDelete: string[] = [];
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              if (
                errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered'
              ) {
                tokensToDelete.push(tokens[idx]);
              }
            }
          });

          if (tokensToDelete.length > 0) {
            console.log(`🧹 Removing ${tokensToDelete.length} stale FCM tokens`);
            await adminClient
              .from('fcm_tokens')
              .delete()
              .in('token', tokensToDelete);
          }
        }
      } catch (fcmError) {
        console.error('❌ Failed to send FCM push notification:', fcmError);
      }
    }

    return { success: true, notificationId: notification.id };
  } catch (err: any) {
    console.error('❌ Unexpected error in createNotification:', err);
    return { success: false, error: err.message || 'Failed to create notification' };
  }
}

/**
 * Register a new FCM registration token for the logged-in user.
 */
export async function registerFcmToken(
  token: string,
  deviceType: 'web' | 'android' | 'ios',
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const adminClient = createAdminClient();

    // Use upsert or insert with conflict resolution on token
    const { error } = await adminClient
      .from('fcm_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          device_type: deviceType,
          device_name: deviceName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('❌ Failed to register FCM token:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Unexpected error in registerFcmToken:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unregisters (deletes) an FCM token. Typically called on logout.
 */
export async function unregisterFcmToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('fcm_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('❌ Failed to unregister FCM token:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Unexpected error in unregisterFcmToken:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch general notifications for the current authenticated user with pagination and filtering.
 */
export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    let query = adminClient
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (params?.unreadOnly) {
      query = query.eq('read_status', false);
    }

    if (params?.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return { data: null, count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0, error: null };
  } catch (err: any) {
    console.error('❌ Unexpected error fetching notifications:', err);
    return { data: null, count: 0, error: err.message };
  }
}

/**
 * Fetch total count of unread notifications for the current authenticated user.
 */
export async function getUnreadNotificationCount(): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { count: 0, error: 'Unauthorized' };

    const adminClient = createAdminClient();

    const { count, error } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read_status', false);

    if (error) {
      console.error('❌ Error fetching unread notification count:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (err: any) {
    console.error('❌ Unexpected error getting unread count:', err);
    return { count: 0, error: err.message };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const adminClient = createAdminClient();

    // Verify ownership before updating
    const { data: notification } = await adminClient
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!notification || notification.user_id !== user.id) {
      return { success: false, error: 'Notification not found or access denied' };
    }

    const { error } = await adminClient
      .from('notifications')
      .update({ is_read: true, read_status: true })
      .eq('id', id);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Unexpected error marking notification as read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark all unread notifications for the current authenticated user as read.
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('notifications')
      .update({ is_read: true, read_status: true })
      .eq('user_id', user.id)
      .eq('read_status', false);

    if (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Unexpected error marking all as read:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const adminClient = createAdminClient();

    // Verify ownership before deleting
    const { data: notification } = await adminClient
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!notification || notification.user_id !== user.id) {
      return { success: false, error: 'Notification not found or access denied' };
    }

    const { error } = await adminClient
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Unexpected error deleting notification:', err);
    return { success: false, error: err.message };
  }
}
