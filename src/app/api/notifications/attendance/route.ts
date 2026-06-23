import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/attendance
 * Fetch attendance notifications for the current user
 * Uses adminClient to bypass RLS, with auth check via server client
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

    // Use admin client to bypass RLS for fetching notifications
    const adminClient = createAdminClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query using admin client
    let query = adminClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'attendance');

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching attendance notifications:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/notifications/attendance:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
