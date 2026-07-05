import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/_lib/supabase/server';
import {
  getNotifications,
  createNotification,
  markAllNotificationsAsRead,
} from '@/app/_lib/actions/notifications';

/**
 * GET: Fetch notifications with optional pagination, type filtering, and unread status.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || 'all';

    const result = await getNotifications({ limit, offset, unreadOnly, type });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      data: result.data,
      count: result.count,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a notification. Available to authenticated teachers/admins.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification (Only teachers/admins can trigger custom system notifications)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      title,
      message,
      type,
      role,
      studentId,
      teacherId,
      priority,
      link,
      schoolId,
      category,
      attendanceId,
      attendanceStatus,
      device,
      platform,
    } = body;

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'userId, title, message, and type are required' },
        { status: 400 }
      );
    }

    const result = await createNotification({
      userId,
      title,
      message,
      type,
      role,
      studentId,
      teacherId,
      priority,
      link,
      schoolId,
      category,
      attendanceId,
      attendanceStatus,
      device,
      platform,
      createdBy: user.id,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, notificationId: result.notificationId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Mark all notifications as read for current user.
 */
export async function PUT(request: NextRequest) {
  try {
    const result = await markAllNotificationsAsRead();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
