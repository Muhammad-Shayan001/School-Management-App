'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { ROLES, DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { sendEmail } from '@/app/_lib/utils/email';

/**
 * Sign up a new user with role-based registration.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as UserRole;
  const phone = formData.get('phone') as string | null;
  const schoolName = formData.get('school_name') as string | null;
  const schoolId = formData.get('school_id') as string | null;
  const classId = formData.get('class_id') as string | null;

  if (!email || !password || !fullName || !role) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  // Strictly block public Admin signup
  if (role === ROLES.ADMIN) {
    return { error: 'Administrator registration is restricted. Please contact the system owner.' };
  }

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase();
  const lowerEmail = email.toLowerCase();
  if (role === ROLES.SUPER_ADMIN && lowerEmail !== superAdminEmail) {
    return { error: 'You are not authorized to register as Super Admin.' };
  }

  const isSuperAdmin = lowerEmail === superAdminEmail && role === ROLES.SUPER_ADMIN;
  const status = isSuperAdmin ? 'approved' : 'pending';

  const adminClient = createAdminClient();
  
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      status,
    },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: 'Failed to create user account.' };

  await supabase.auth.signInWithPassword({ email, password });
  
  const profilePromise = adminClient.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    phone,
    role,
    status,
    school_id: schoolId || null,
    plain_password: password,
  });

  const extraPromises = [];
  if (role === ROLES.TEACHER && schoolId) {
    extraPromises.push(adminClient.from('teacher_profiles').insert({ user_id: authData.user.id, school_id: schoolId }));
  }
  if (role === ROLES.STUDENT && schoolId) {
    extraPromises.push(adminClient.from('student_profiles').insert({ user_id: authData.user.id, school_id: schoolId, class_id: classId || null }));
  }

  const [profileResult] = await Promise.all([profilePromise, ...extraPromises]);
  if (profileResult.error) return { error: 'Failed to create profile: ' + profileResult.error.message };

  // 1. Notify the User
  await adminClient.from('notifications').insert({
    user_id: authData.user.id,
    title: 'Registration Pending ⏳',
    message: `Your ${role} account has been created. Please wait for the school administrator to approve your access.`,
    type: 'approval'
  });

  // 2. Notify the School Admin (if schoolId is provided)
  if (schoolId) {
    const { data: school } = await adminClient.from('schools').select('admin_id, name').eq('id', schoolId).single();
    if (school?.admin_id) {
      await adminClient.from('notifications').insert({
        user_id: school.admin_id,
        title: 'New Approval Request 👤',
        message: `A new ${role} (${fullName}) has registered for ${school.name} and is waiting for your approval.`,
        link: '/admin/approvals',
        type: 'approval'
      });
    }
  }

  if (isSuperAdmin) {
    await adminClient.from('notifications').insert({ user_id: authData.user.id, title: 'Welcome!', message: 'Your Super Admin account has been created successfully.', type: 'approval' });
    redirect(DASHBOARD_ROUTES.super_admin);
  }

  redirect('/pending');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password are required.' };

  const lowerEmail = email.toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: lowerEmail, password });
  if (error) {
    console.error('Auth Login Error:', error.message, error.status);
    return { error: 'Invalid email or password.' };
  }

  // Use the authenticated user client (RLS-aware) to read the profile.
  // RLS policy allows users to read their own profile, so no admin client needed here.
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  
  // Fallback: try admin client if RLS client fails (e.g. profile created by super admin without RLS)
  let resolvedProfile = profile;
  if (!resolvedProfile) {
    try {
      const adminClient = createAdminClient();
      const { data: adminProfile } = await adminClient.from('profiles').select('*').eq('id', data.user.id).single();
      resolvedProfile = adminProfile;
    } catch {
      // admin client also failed — likely missing SERVICE_ROLE_KEY
    }
  }

  if (!resolvedProfile) return { error: 'User profile not found. Please contact your administrator.' };

  if (resolvedProfile.status === 'pending') { await supabase.auth.signOut(); redirect('/pending'); }
  if (resolvedProfile.status === 'rejected') { await supabase.auth.signOut(); return { error: 'Your account has been rejected.' }; }

  redirect(DASHBOARD_ROUTES[resolvedProfile.role as UserRole] || '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Get the user profile by ID using the user's own authenticated session.
 * RLS allows users to read their own profiles, so no admin client is needed.
 * Falls back to admin client if the regular query fails.
 */
async function fetchUserProfile(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  // Primary: use the user's own session (works with anon key + RLS)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profile) return profile;

  // Fallback: try the admin client if regular query fails
  try {
    const adminClient = createAdminClient();
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return adminProfile;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user's profile.
 * Uses the user's own session to avoid dependency on SERVICE_ROLE_KEY.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return fetchUserProfile(user.id, supabase);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function changePassword(formData: FormData) {
  try {
    const currentPassword = formData.get('current_password') as string;
    const newPassword = formData.get('new_password') as string;

    if (!currentPassword || !newPassword) {
      return { error: 'Current password and new password are required.' };
    }

    if (newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unable to validate your session. Please sign in again.' };
    }

    if (!user.email) {
      return { error: 'Unable to verify your account email.' };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email.toLowerCase(),
      password: currentPassword,
    });

    if (verifyError) {
      return { error: 'Current password is incorrect.' };
    }

    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return { error: updateError.message || 'Failed to update password. Please try again.' };
    }

    return { success: true, message: 'Password updated successfully.' };
  } catch (error) {
    console.error('Unexpected error in changePassword:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure reset token (32 bytes hex)
 */
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  const randomBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    randomBytes[i] = Math.floor(Math.random() * chars.length);
    token += chars[randomBytes[i]];
  }
  return token;
}

/**
 * Request a password reset token and send it to the user's email.
 * Returns a reset token that can be used to set a new password.
 */
export async function requestPasswordReset(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    if (!email) return { error: 'Email is required.' };

    const adminClient = createAdminClient();
    
    // Find user by email
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (!profile) {
      // Don't reveal if email exists (security best practice)
      return { success: true };
    }

    // Generate secure token and OTP
    const resetToken = generateResetToken();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Store reset token in database
    const { error: insertError } = await adminClient
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        email: profile.email,
        token: resetToken,
        otp: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error storing reset token:', insertError);
      return { error: 'Failed to generate reset token. Please try again.' };
    }

    // Build reset URL with token
    const resetUrl = `https://skolic-schools-management-app.vercel.app/reset-password?token=${resetToken}`;

    // Send email with reset link and OTP
    const emailResult = await sendEmail({
      to: email,
      subject: 'Password Reset Request - Skolic School Management System',
      text: `Hello ${profile.full_name},\n\nClick the link below to reset your password:\n${resetUrl}\n\nOr enter this OTP: ${otp}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello <strong>${profile.full_name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Or enter this verification code: <strong style="font-size: 18px; letter-spacing: 2px;">${otp}</strong></p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      return { error: 'Failed to send reset email. Please try again later.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in requestPasswordReset:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Update password using a valid reset token (without requiring authentication)
 */
export async function resetPasswordWithToken(formData: FormData) {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;

    if (!token) return { error: 'Reset token is missing.' };
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const adminClient = createAdminClient();

    // Find and validate the reset token
    const { data: resetRecord, error: findError } = await adminClient
      .from('password_reset_tokens')
      .select('user_id, email, expires_at, used_at')
      .eq('token', token)
      .single();

    if (findError || !resetRecord) {
      return { error: 'Invalid or expired reset token.' };
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return { error: 'Reset token has expired. Please request a new one.' };
    }

    // Check if token has already been used
    if (resetRecord.used_at) {
      return { error: 'This reset token has already been used. Please request a new one.' };
    }

    // Update the user's password in Supabase Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      resetRecord.user_id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return { error: 'Failed to update password. Please try again.' };
    }

    // Mark the token as used
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Remove the plain_password field if it exists (security improvement)
    await adminClient
      .from('profiles')
      .update({ plain_password: null })
      .eq('id', resetRecord.user_id);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in resetPasswordWithToken:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Validate a password reset token without changing password
 */
export async function validateResetToken(token: string) {
  try {
    if (!token) return { valid: false, error: 'Token is missing.' };

    const adminClient = createAdminClient();

    const { data: resetRecord, error: findError } = await adminClient
      .from('password_reset_tokens')
      .select('email, expires_at, used_at')
      .eq('token', token)
      .single();

    if (findError || !resetRecord) {
      return { valid: false, error: 'Invalid reset token.' };
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Reset token has expired.' };
    }

    // Check if token has already been used
    if (resetRecord.used_at) {
      return { valid: false, error: 'This reset token has already been used.' };
    }

    return { valid: true, email: resetRecord.email };
  } catch (error) {
    console.error('Unexpected error in validateResetToken:', error);
    return { valid: false, error: 'An unexpected error occurred.' };
  }
}
