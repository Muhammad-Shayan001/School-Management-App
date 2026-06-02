import { createClient } from '@/app/_lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/notifications/attendance/mark-all-read
 * Mark all attendance notifications as read for current user
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update all unread attendance notifications for this user
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'attendance')
      .eq('is_read', false);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in PUT /api/notifications/attendance/mark-all-read:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
