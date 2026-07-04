import { NextRequest, NextResponse } from 'next/server';
import { registerFcmToken } from '@/app/_lib/actions/notifications';

/**
 * POST: Register a device token (FCM token) for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, deviceType, deviceName } = body;

    if (!token || !deviceType) {
      return NextResponse.json(
        { error: 'token and deviceType are required' },
        { status: 400 }
      );
    }

    if (deviceType !== 'web' && deviceType !== 'android' && deviceType !== 'ios') {
      return NextResponse.json(
        { error: 'deviceType must be web, android, or ios' },
        { status: 400 }
      );
    }

    const result = await registerFcmToken(token, deviceType, deviceName);

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
