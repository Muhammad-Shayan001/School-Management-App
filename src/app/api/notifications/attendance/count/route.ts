import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/attendance/count
 * Get unread attendance notification count for current user
 * Uses adminClient to bypass RLS
 */
export async function GET(request: NextRequest) {
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

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get unread count
    const { count, error } = await adminClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'attendance')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/notifications/attendance/count:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
