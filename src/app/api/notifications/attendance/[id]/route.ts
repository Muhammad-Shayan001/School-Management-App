import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/notifications/attendance/[id]
 * Mark a specific notification as read
 * Uses adminClient to bypass RLS
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user via server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // Verify notification belongs to user (using admin client)
    const { data: notification, error: fetchError } = await adminClient
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !notification || notification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 403 }
      );
    }

    // Update the notification using admin client
    const { error: updateError } = await adminClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in PUT /api/notifications/attendance/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/attendance/[id]
 * Delete a specific notification
 * Uses adminClient to bypass RLS
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user via server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // Verify notification belongs to user (using admin client)
    const { data: notification, error: fetchError } = await adminClient
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !notification || notification.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 403 }
      );
    }

    // Delete the notification using admin client
    const { error: deleteError } = await adminClient
      .from('notifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/notifications/attendance/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
