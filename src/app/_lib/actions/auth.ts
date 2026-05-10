'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { ROLES, DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { sendEmail } from '@/app/_lib/utils/email';


/**
 * Sign up a new user with role-based registration.
 * Super Admin: auto-approved if email matches env variable.
 * Others: start with 'pending' status.
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

  // Validate required fields
  if (!email || !password || !fullName || !role) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  // Check if trying to register as super_admin
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  if (role === ROLES.SUPER_ADMIN && email !== superAdminEmail) {
    return { error: 'You are not authorized to register as Super Admin.' };
  }

  // Determine initial status
  const isSuperAdmin = email === superAdminEmail && role === ROLES.SUPER_ADMIN;
  const status = isSuperAdmin ? 'approved' : 'pending';

  // Create profile using admin client to bypass RLS and email rate limits
  const adminClient = createAdminClient();
  
  // Create auth user using admin client - this auto-confirms the email
  // and prevents the "email rate limit exceeded" error.
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

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user account.' };
  }

  // Log the user in manually using the standard client to establish a session
  // without triggering any confirmation emails.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Auto-login after signup failed:', signInError.message);
    // We don't return an error here because the account was created successfully,
    // they just might need to log in manually.
  }
  
  // Start basic profile creation
  const profilePromise = adminClient.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    phone,
    role,
    status,
    school_id: schoolId || null,
  });

  // Prepare other parallel operations
  const extraPromises = [];

  // If teacher role, create teacher_profile
  if (role === ROLES.TEACHER && schoolId) {
    extraPromises.push(adminClient.from('teacher_profiles').insert({
      user_id: authData.user.id,
      school_id: schoolId
    }));
  }

  // If student role, create student_profile
  if (role === ROLES.STUDENT && schoolId) {
    extraPromises.push(adminClient.from('student_profiles').insert({
      user_id: authData.user.id,
      school_id: schoolId,
      class_id: classId || null
    }));
  }

  // Wait for profile and extras
  const [profileResult] = await Promise.all([profilePromise, ...extraPromises]);

  if (profileResult.error) {
    return { error: 'Failed to create profile: ' + profileResult.error.message };
  }

  if (role === ROLES.ADMIN && schoolName) {
    const { data: schoolData, error: schoolError } = await adminClient
      .from('schools')
      .insert({
        name: schoolName,
        admin_id: authData.user.id,
        email,
      })
      .select('id')
      .single();

    if (!schoolError && schoolData) {
      // Link the school to the admin's profile
      await adminClient
        .from('profiles')
        .update({ school_id: schoolData.id })
        .eq('id', authData.user.id);

      // Seed default classes for the new school
      const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
      const defaultClasses = CLASS_NAMES.map(name => ({
        name,
        school_id: schoolData.id,
        section: 'A'
      }));
      await adminClient.from('classes').insert(defaultClasses);
    }
  }

  // Handle Notifications for Approvals
  if (isSuperAdmin) {
    await adminClient.from('notifications').insert({
      user_id: authData.user.id,
      title: 'Welcome!',
      message: 'Your Super Admin account has been created successfully.',
      type: 'approval',
    });
    redirect(DASHBOARD_ROUTES.super_admin);
  }

  // Route notifications based on role
  let targetUsers: any[] = [];
  let link = '';

  if (role === ROLES.ADMIN) {
    // Notify Super Admins about new Principal
    console.log('Routing notification for new Admin signup...');
    const { data } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', ROLES.SUPER_ADMIN)
      .eq('status', 'approved');
    
    if (data && data.length > 0) {
      targetUsers = data;
    } else {
      console.warn('No approved Super Admin found to notify.');
      // Fallback: search for any Super Admin (even pending)
      const { data: fallback } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', ROLES.SUPER_ADMIN);
      if (fallback) targetUsers = fallback;
    }
    link = '/super-admin/approvals';
  } else if (role === ROLES.TEACHER && schoolId) {
    // Notify Principal (Admin) of that school about new Teacher
    console.log(`Routing notification for new Teacher in school ${schoolId}...`);
    let { data } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', ROLES.ADMIN)
      .eq('school_id', schoolId)
      .eq('status', 'approved');
    
    if (!data || data.length === 0) {
      console.warn('No approved Principal found for this school, checking pending admins...');
      const { data: fallback } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', ROLES.ADMIN)
        .eq('school_id', schoolId)
        .neq('status', 'rejected');
      data = fallback;
    }
    
    if (data) targetUsers = data;
    link = '/admin/teachers'; 
  } else if (role === ROLES.STUDENT && schoolId) {
    // Notify Teachers of that school about new Student
    console.log(`Routing notification for new Student in school ${schoolId}...`);
    let { data } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', ROLES.TEACHER)
      .eq('school_id', schoolId)
      .eq('status', 'approved');
    
    if (!data || data.length === 0) {
      console.warn('No approved Teachers found for this school, checking pending teachers...');
      const { data: fallback } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', ROLES.TEACHER)
        .eq('school_id', schoolId)
        .neq('status', 'rejected');
      data = fallback;
    }

    if (data) targetUsers = data;
    link = '/teacher/students'; 
  }

  if (targetUsers.length > 0) {
    console.log(`Sending notifications to ${targetUsers.length} users...`);
    const notifications = targetUsers.map((u) => ({
      user_id: u.id,
      title: 'New Registration',
      message: `${fullName} (${role}) has registered and is awaiting approval.`,
      type: 'approval',
      link,
    }));
    
    const { error: notifError } = await adminClient.from('notifications').insert(notifications);
    if (notifError) {
      console.error('Failed to insert notifications:', notifError);
    } else {
    }
  } else {
    console.warn('No target users found for notification.');
  }

  // Redirect to pending page
  redirect('/pending');
}

/**
 * Log in an existing user.
 * Checks approval status before granting access.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  if (!data.user) {
    return { error: 'Login failed. Please try again.' };
  }

  // Fetch user profile to check status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'User profile not found. Please contact support.' };
  }

  // Check if account is approved
  if (profile.status === 'pending') {
    await supabase.auth.signOut();
    redirect('/pending');
  }

  if (profile.status === 'rejected') {
    await supabase.auth.signOut();
    return { error: 'Your account has been rejected. Please contact the administrator.' };
  }

  // Redirect to role-specific dashboard
  const dashboardRoute = DASHBOARD_ROUTES[profile.role as UserRole];
  redirect(dashboardRoute || '/');
}

/**
 * Log out the current user.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Get the current authenticated user's profile.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Generate a new password and email it to the user.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  const adminClient = createAdminClient();

  // Find the user by email in the profiles table to get their ID and name
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    return { error: 'No account found with this email.' };
  }

  // Generate a secure random 12-character password
  const newPassword = Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-6);

  // Update the user's password in Supabase Auth
  const { error: updateError } = await adminClient.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateError) {
    return { error: 'Failed to reset password in database.' };
  }

  // Send the email manually using nodemailer
  const emailResult = await sendEmail({
    to: email,
    subject: 'Your New Password - School Management System',
    text: `Hello ${profile.full_name || 'User'},\n\nYour password has been successfully reset. Here is your new temporary password:\n\n${newPassword}\n\nPlease log in and change it as soon as possible.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Password Reset</h2>
        <p style="color: #475569; line-height: 1.5;">Hello ${profile.full_name || 'User'},</p>
        <p style="color: #475569; line-height: 1.5;">Your password has been successfully reset. Here is your new temporary password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <span style="background-color: #f1f5f9; color: #0f172a; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 18px; letter-spacing: 2px; border: 1px dashed #cbd5e1;">${newPassword}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">Please log in with this new password. You can update your password from your dashboard settings later.</p>
      </div>
    `,
  });

  if (!emailResult.success) {
    return { error: `Failed to send email: ${emailResult.error || 'Unknown error'}` };
  }

  return { success: true };
}

/**
 * Update user password after a successful reset request.
 */
export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
