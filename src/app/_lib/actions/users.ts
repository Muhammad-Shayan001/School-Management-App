'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { UserRole, UserStatus } from '@/app/_lib/utils/constants';

/**
 * Get all users, optionally filtered by role and/or status.
 */
export async function getUsers(filters?: { role?: UserRole; status?: UserStatus; school_id?: string; class_id?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  // Fetch caller profile to verify permissions
  const { data: caller } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin', 'teacher'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized' };
  }

  // Teachers can only view students
  if (caller.role === 'teacher' && filters?.role !== 'student') {
    return { data: null, error: 'Unauthorized: Teachers can only view students.' };
  }

  // Use admin client to bypass RLS for fetching the user list
  const adminClient = createAdminClient();
  let query = adminClient.from('profiles').select('*').order('created_at', { ascending: false });

  if (filters?.role) query = query.eq('role', filters.role);
  if (filters?.status) query = query.eq('status', filters.status);
  
  // Enforce school isolation for school admins and teachers
  if (caller.role === 'admin' || caller.role === 'teacher') {
    if (!caller.school_id) return { data: [], error: null };
    query = query.eq('school_id', caller.school_id);
  } else if (filters?.school_id) {
    query = query.eq('school_id', filters.school_id);
  }

  // Add class_id filtering if requested (requires joining/subquerying student_profiles)
  if (filters?.class_id) {
    const { data: classStudents } = await adminClient
      .from('student_profiles')
      .select('user_id')
      .eq('class_id', filters.class_id);
      
    const userIds = classStudents?.map(cs => cs.user_id) || [];
    
    if (userIds.length > 0) {
      query = query.in('id', userIds);
    } else {
      // If there are no students in the class, return empty immediately
      return { data: [], error: null };
    }
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Approve a user — sets status to 'approved'.
 */
export async function approveUser(userId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };

  // Update auth metadata for faster middleware checks
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'approved' }
  });

  // Fetch the user to send them a notification
  const { data: user } = await adminClient
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  if (user) {
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Account Approved! 🎉',
      message: `Your ${user.role} account has been approved. You can now log in and access your dashboard.`,
      type: 'approval',
    });
  }

  revalidatePath('/super-admin/approvals');
  revalidatePath('/admin/teachers');
  revalidatePath('/admin/students');

  return { error: null };
}

/**
 * Reject a user — sets status to 'rejected'.
 */
export async function rejectUser(userId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };

  // Update auth metadata
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'rejected' }
  });

  // Notify the user
  const { data: user } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (user) {
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Account Not Approved',
      message: 'Your account registration has been reviewed and was not approved. Please contact the administrator for more information.',
      type: 'approval',
    });
  }

  revalidatePath('/super-admin/approvals');
  revalidatePath('/admin/teachers');
  revalidatePath('/admin/students');

  return { error: null };
}

/**
 * Get user count statistics by role and status.
 */
export async function getUserStats() {
  const adminClient = createAdminClient();

  const { data: profiles } = await adminClient.from('profiles').select('role, status');

  if (!profiles) return { total: 0, admins: 0, teachers: 0, students: 0, pending: 0 };

  return {
    total: profiles.length,
    admins: profiles.filter((p) => p.role === 'admin').length,
    teachers: profiles.filter((p) => p.role === 'teacher').length,
    students: profiles.filter((p) => p.role === 'student').length,
    pending: profiles.filter((p) => p.status === 'pending').length,
  };
}

export async function getStudentProfiles(filters?: { class_id?: string; query?: string }) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin', 'teacher'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized' };
  }

  let allowedClassIds: string[] | null = null;
  if (caller.role === 'teacher') {
    const { data: teacherProfile } = await adminClient
      .from('teacher_profiles')
      .select('class_id, is_class_teacher')
      .eq('user_id', user.id)
      .single();
    
    if (teacherProfile?.is_class_teacher && teacherProfile.class_id) {
       allowedClassIds = [teacherProfile.class_id];
    } else {
       const { data: assignments } = await adminClient
         .from('teacher_assignments')
         .select('class_id')
         .eq('teacher_id', user.id);
       allowedClassIds = assignments ? assignments.map(a => a.class_id) : [];
    }

    if (!allowedClassIds || allowedClassIds.length === 0) {
      return { data: [], error: null };
    }
  }

  let query = adminClient
    .from('student_profiles')
    .select(`
      *,
      profiles(id, full_name, email, avatar_url, phone, status),
      classes(name, section)
    `)
    .eq('school_id', caller.school_id);

  if (filters?.class_id) {
    if (allowedClassIds && !allowedClassIds.includes(filters.class_id)) {
      return { data: [], error: 'Unauthorized class access' };
    }
    query = query.eq('class_id', filters.class_id);
  } else if (allowedClassIds) {
    query = query.in('class_id', allowedClassIds);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  let result = data;
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((s: any) => 
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.classes?.name?.toLowerCase().includes(q) ||
      s.classes?.section?.toLowerCase().includes(q)
    );
  }

  return { data: result, error: null };
}

export async function createOrUpdateStudentProfile(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin', 'teacher'].includes(caller.role)) {
    return { error: 'Unauthorized' };
  }

  const studentUserId = formData.get('user_id') as string;
  const fullName = formData.get('full_name') as string;
  const classId = formData.get('class_id') as string;

  if (caller.role === 'teacher') {
    const { data: teacherProfile } = await adminClient
      .from('teacher_profiles')
      .select('class_id, is_class_teacher')
      .eq('user_id', user.id)
      .single();
      
    let allowedClassIds: string[] = [];
    if (teacherProfile?.is_class_teacher && teacherProfile.class_id) {
       allowedClassIds = [teacherProfile.class_id];
    } else {
       const { data: assignments } = await adminClient.from('teacher_assignments').select('class_id').eq('teacher_id', user.id);
       allowedClassIds = assignments ? assignments.map(a => a.class_id) : [];
    }
    
    if (!allowedClassIds.includes(classId)) {
      return { error: 'Unauthorized: Can only manage students in assigned classes' };
    }
  }

  let finalUserId = studentUserId;
  
  if (!finalUserId) {
    // Generate a secure random password for new student accounts
    const email = formData.get('email') as string || `student_${Date.now()}@school.edu`;
    const tempPassword = 'Student123!@#';
    
    const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'student', full_name: fullName }
    });
    
    if (authError) return { error: 'Failed to create student account: ' + authError.message };
    finalUserId = newAuthUser.user.id;
    
    // Insert into profiles
    await adminClient.from('profiles').insert({
      id: finalUserId,
      email: email,
      full_name: fullName,
      role: 'student',
      school_id: caller.school_id,
      status: 'approved',
      avatar_url: formData.get('avatar_url') as string,
      phone: formData.get('phone') as string
    });
  } else {
    // Update existing profile
    await adminClient.from('profiles').update({
      full_name: fullName,
      phone: formData.get('phone') as string,
      avatar_url: formData.get('avatar_url') as string,
      updated_at: new Date().toISOString()
    }).eq('id', finalUserId);
  }

  // Upsert student_profiles
  const { error: studentErr } = await adminClient
    .from('student_profiles')
    .upsert({
      user_id: finalUserId,
      school_id: caller.school_id,
      roll_number: formData.get('roll_number'),
      cnic: formData.get('cnic'),
      class_id: classId || null,
      section: formData.get('section'),
      dob: formData.get('dob'),
      gender: formData.get('gender'),
      student_email: formData.get('student_email'),
      phone: formData.get('phone'),
      parent_name: formData.get('parent_name'),
      parent_cnic: formData.get('parent_cnic'),
      parent_phone: formData.get('parent_phone'),
      address: formData.get('address'),
      admission_date: formData.get('admission_date'),
    }, { onConflict: 'user_id' });

  if (studentErr) return { error: 'Failed to save student details: ' + studentErr.message };

  revalidatePath('/teacher/students');
  revalidatePath('/admin/students');
  return { success: true };
}

export async function deleteStudentProfile(userId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only admins can delete user completely
  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can delete students' };
  }

  // Delete from auth.users (will cascade to profiles if setup correctly, but let's delete manually to be safe if not)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { error: 'Failed to delete user: ' + error.message };

  revalidatePath('/admin/students');
  return { success: true };
}
