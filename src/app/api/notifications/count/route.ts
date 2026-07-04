import { NextResponse } from 'next/server';
import { getUnreadNotificationCount } from '@/app/_lib/actions/notifications';

/**
 * GET: Fetch unread notifications count for the current user.
 */
export async function GET() {
  try {
    const result = await getUnreadNotificationCount();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ count: result.count });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
