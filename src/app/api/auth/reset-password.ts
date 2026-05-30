import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';

/**
 * POST /api/auth/reset-password
 * Reset password using a valid reset token
 * 
 * Request body:
 * {
 *   "token": "reset-token-from-email",
 *   "password": "new-password"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Find and validate the reset token
    const { data: resetRecord, error: findError } = await adminClient
      .from('password_reset_tokens')
      .select('user_id, email, expires_at, used_at')
      .eq('token', token)
      .single();

    if (findError || !resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (resetRecord.used_at) {
      return NextResponse.json(
        { error: 'This reset token has already been used.' },
        { status: 400 }
      );
    }

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      resetRecord.user_id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password.' },
        { status: 500 }
      );
    }

    // Mark the token as used
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Clean up plain_password if it exists
    await adminClient
      .from('profiles')
      .update({ plain_password: null })
      .eq('id', resetRecord.user_id)
      .catch(() => {
        // Ignore errors if field doesn't exist
      });

    return NextResponse.json(
      { success: true, message: 'Password reset successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password reset endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Validate a password reset token
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is missing.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: resetRecord, error: findError } = await adminClient
      .from('password_reset_tokens')
      .select('email, expires_at, used_at')
      .eq('token', token)
      .single();

    if (findError || !resetRecord) {
      return NextResponse.json(
        { valid: false, error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Reset token has expired.' },
        { status: 400 }
      );
    }

    // Check if already used
    if (resetRecord.used_at) {
      return NextResponse.json(
        { valid: false, error: 'This reset token has already been used.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, email: resetRecord.email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { valid: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
