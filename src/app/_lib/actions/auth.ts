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

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is required.' };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from('profiles').select('id, full_name, plain_password').eq('email', email).single();
  if (!profile) return { error: 'No account found.' };

  let passwordToSend = profile.plain_password;

  if (!passwordToSend) {
    // Self-healing fallback for legacy users: Generate a new password, update auth, and store in DB
    passwordToSend = Math.random().toString(36).slice(-8) + 'Rc@1';
    await adminClient.auth.admin.updateUserById(profile.id, { password: passwordToSend });
    await adminClient.from('profiles').update({ plain_password: passwordToSend }).eq('id', profile.id);
  }

  await sendEmail({
    to: email,
    subject: 'Your Account Password Recovery',
    text: `Your password is: ${passwordToSend}`,
    html: `<p>Your password is: <strong>${passwordToSend}</strong></p>`
  });

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters.' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const adminClient = createAdminClient();
      await adminClient.from('profiles').update({ plain_password: password }).eq('id', user.id);
    }
  } catch (e) {
    console.error('Failed to update plain_password in profiles:', e);
  }

  return { success: true };
}
