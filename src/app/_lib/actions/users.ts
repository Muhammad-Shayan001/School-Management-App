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

  // Use admin client to bypass RLS for caller profile check
  const adminClient = createAdminClient();
  const { data: caller } = await adminClient
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

  // Build query using the admin client already created above
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
 * Update student fee status.
 */
export async function updateFeeStatus(studentId: string, status: 'paid' | 'unpaid') {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can manage fee status.' };
  }

  const { error } = await adminClient
    .from('student_profiles')
    .update({ fee_status: status })
    .eq('user_id', studentId);

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  return { success: true };
}

/**
 * Mark all students in the school as 'unpaid'.
 */
export async function markAllStudentsUnpaid() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can manage fee status.' };
  }

  const { error } = await adminClient
    .from('student_profiles')
    .update({ fee_status: 'unpaid' })
    .eq('school_id', caller.school_id);

  if (error) return { error: error.message };

  revalidatePath('/admin/students');
  return { success: true };
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

export async function getStudentProfiles(filters?: { class_id?: string; query?: string; campus_id?: string }) {
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
 
  const isSuperAdmin = caller.role === 'super_admin';
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
 
  // Build initial query including the academy batch join. If the DB schema
  // doesn't include the batch_id column (migration not applied yet) the
  // query will fail — in that case retry without the batch join so the
  // students list still works.
  const baseSelect = `
      *,
      profiles(id, full_name, email, avatar_url, phone, status),
      classes(name, section)
    `;
 
  let initialQuery = adminClient
    .from('student_profiles')
    .select(`${baseSelect}, batch:subjects!batch_id(id, name)`);

  if (!isSuperAdmin) {
    initialQuery = initialQuery.eq('school_id', caller.school_id);
  }

  if (filters?.class_id) {
    if (allowedClassIds && !allowedClassIds.includes(filters.class_id)) {
      return { data: [], error: 'Unauthorized class access' };
    }
    initialQuery = initialQuery.eq('class_id', filters.class_id);
  } else if (allowedClassIds) {
    initialQuery = initialQuery.in('class_id', allowedClassIds);
  }

  if (filters?.campus_id) {
    initialQuery = initialQuery.eq('campus_id', filters.campus_id);
  }

  // Execute initial query and fallback if necessary
  const { data: initialData, error: initialError } = await initialQuery;
  let data;
  if (initialError) {
    // If the error indicates a missing column (e.g. batch_id) or Postgres code 42703,
    // try a simpler query without the batch join so the students list continues to work.
    const errMsg = String(initialError.message || '').toLowerCase();
    if (errMsg.includes('batch_id') || initialError.code === '42703' || errMsg.includes('column') ) {
      let fallbackQuery = adminClient
        .from('student_profiles')
        .select(baseSelect);

      if (!isSuperAdmin) {
        fallbackQuery = fallbackQuery.eq('school_id', caller.school_id);
      }
      if (filters?.class_id) {
        if (allowedClassIds && !allowedClassIds.includes(filters.class_id)) {
          return { data: [], error: 'Unauthorized class access' };
        }
        fallbackQuery = fallbackQuery.eq('class_id', filters.class_id);
      }
      if (filters?.campus_id) {
        fallbackQuery = fallbackQuery.eq('campus_id', filters.campus_id);
      }

      const { data: fallbackData, error: fallbackErr } = await fallbackQuery;
      if (fallbackErr) return { data: null, error: fallbackErr.message };
      data = fallbackData;
    } else {
      return { data: null, error: initialError.message };
    }
  } else {
    data = initialData;
  }

  // If initial query returned no student_profiles for this school, it's possible
  // that student_profiles.school_id was not set when records were created. In that
  // case, fall back to finding student user profiles (profiles.role = 'student')
  // for this school and then fetch any matching student_profiles by user_id.
  if ((!data || data.length === 0) && caller.role !== 'teacher') {
    let profileQuery = adminClient
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone, status');

    if (!isSuperAdmin) {
      profileQuery = profileQuery.eq('school_id', caller.school_id);
    }
    const { data: studentAccounts } = await profileQuery.eq('role', 'student');

    if (studentAccounts && studentAccounts.length > 0) {
      const userIds = studentAccounts.map((p: any) => p.id);

      // Try to fetch student_profiles for these user_ids (without relying on student_profiles.school_id)
      let spQuery = adminClient
        .from('student_profiles')
        .select(`${baseSelect}, batch:subjects!batch_id(id, name)`)
        .in('user_id', userIds);

      if (filters?.class_id) {
        if (allowedClassIds && !allowedClassIds.includes(filters.class_id)) {
          return { data: [], error: 'Unauthorized class access' };
        }
        spQuery = spQuery.eq('class_id', filters.class_id);
      } else if (allowedClassIds) {
        spQuery = spQuery.in('class_id', allowedClassIds);
      }

      if (filters?.campus_id) {
        spQuery = spQuery.eq('campus_id', filters.campus_id);
      }

      const { data: spData, error: spErr } = await spQuery;
      let studentProfilesById: Record<string, any> = {};

      if (spErr) {
        // Fallback without batch join
        const { data: spFallback, error: spFallbackErr } = await adminClient
          .from('student_profiles')
          .select(baseSelect)
          .in('user_id', userIds);
        if (spFallbackErr) return { data: null, error: spFallbackErr.message };
        (spFallback || []).forEach((s: any) => { studentProfilesById[s.user_id] = s; });
      } else {
        (spData || []).forEach((s: any) => { studentProfilesById[s.user_id] = s; });
      }

      // Build combined list: prefer student_profiles entries but include placeholder
      // entries for accounts that don't have a student_profiles row.
      const combined = studentAccounts.map((p: any) => {
        const sp = studentProfilesById[p.id];
        if (sp) return sp;
        return {
          user_id: p.id,
          school_id: caller.school_id || null,
          roll_number: null,
          class_id: null,
          campus_id: null,
          profiles: p,
        };
      });

      data = combined;
    }
  }

  let result = data || [];

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((s: any) => 
      (s.profiles?.full_name || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toString().toLowerCase().includes(q) ||
      (s.classes?.name || '').toLowerCase().includes(q) ||
      (s.classes?.section || '').toLowerCase().includes(q)
    );
  }

  return { data: result, error: null };
}

/**
 * Generates a unique Student ID in format: STD-YYYY-XXX
 */
async function generateStudentId() {
  const adminClient = createAdminClient();
  const year = new Date().getFullYear();
  const prefix = `STD-${year}-`;
  
  const { data } = await adminClient
    .from('student_profiles')
    .select('student_id')
    .like('student_id', `${prefix}%`);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const numbers = data.map(d => {
      const parts = d.student_id.split('-');
      const num = parseInt(parts[parts.length - 1]);
      return isNaN(num) ? 0 : num;
    });
    nextNumber = Math.max(...numbers) + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Generates a unique Teacher ID in format: TCH-YYYY-XXX
 */
async function generateTeacherId() {
  const adminClient = createAdminClient();
  const year = new Date().getFullYear();
  const prefix = `TCH-${year}-`;
  
  const { data } = await adminClient
    .from('teacher_profiles')
    .select('teacher_id')
    .like('teacher_id', `${prefix}%`);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const numbers = data.map(d => {
      const parts = d.teacher_id.split('-');
      const num = parseInt(parts[parts.length - 1]);
      return isNaN(num) ? 0 : num;
    });
    nextNumber = Math.max(...numbers) + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}


export async function createOrUpdateStudentProfile(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized: No active session found.' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: `Unauthorized: Your role is ${caller?.role || 'unknown'}. Only admins can modify/add students.` };
  }

  const userId = formData.get('user_id') as string | null;

  if (userId) {
    // Update existing student
    const fullName = formData.get('full_name') as string;
    
    await adminClient.from('profiles').update({
      full_name: fullName,
      phone: formData.get('phone') as string,
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    const studentData: any = {
      user_id: userId,
      school_id: caller.school_id,
      roll_number: formData.get('roll_number') || null,
      class_id: formData.get('class_id') || null,
      section: formData.get('section') || null,
      parent_name: formData.get('parent_name') || null,
      parent_phone: formData.get('parent_phone') || null,
      gender: formData.get('gender') || 'male',
      dob: formData.get('dob') || null,
      address: formData.get('address') || null,
    };

    const { error: studentErr } = await adminClient
      .from('student_profiles')
      .upsert(studentData, { onConflict: 'user_id' });

    if (studentErr) return { error: 'Failed to save student details: ' + studentErr.message };

    revalidatePath('/admin/students');
    return { success: true };
  } else {
    // Creating new student using existing createManualStudent logic
    const plainData: any = {};
    for (const [key, value] of formData.entries()) {
      plainData[key] = value;
    }
    return createManualStudent(plainData);
  }
}

export async function createManualStudent(formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can manually create students.' };
  }

  const email = formData.email;
  const fullName = formData.full_name;
  // Generate a professional random password
  const autoPassword = Math.random().toString(36).slice(-8) + 'Sc!';
  const studentId = await generateStudentId();
  const rollNumber = formData.roll_number || studentId.replace('STD-', '');

  // 1. Create Auth Account
  const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: formData.password || autoPassword,
    email_confirm: true,
    user_metadata: { role: 'student', full_name: fullName, school_id: caller.school_id, status: 'approved' }
  });

  if (authError) return { error: 'Failed to create auth account: ' + authError.message };
  const studentUserId = newAuthUser.user.id;

  // 2. Create Profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: studentUserId,
    email: email,
    full_name: fullName,
    role: 'student',
    school_id: caller.school_id,
    status: 'approved',
    avatar_url: formData.avatar_url,
    phone: formData.phone,
    plain_password: formData.password || autoPassword
  });

  if (profileError) {
    console.error('Error inserting student profile, rolling back auth account:', profileError);
    await adminClient.auth.admin.deleteUser(studentUserId);
    return { error: 'Failed to create profile: ' + profileError.message };
  }

  // 3. Create Student Profile record
  const { error: studentErr } = await adminClient
    .from('student_profiles')
    .insert({
      user_id: studentUserId,
      school_id: caller.school_id,
      campus_id: formData.campus_id || null,
      student_id: studentId,
      roll_number: rollNumber,
      cnic: formData.cnic,
      class_id: formData.class_id || null,
      section: formData.section,
      dob: formData.dob || null,
      gender: formData.gender,
      phone: formData.phone,
      fee_status: 'unpaid',
      registration_no: formData.registration_no,
      admission_date: formData.admission_date || new Date().toISOString().split('T')[0],
      fee_discount: parseFloat(formData.fee_discount || '0'),
      sms_phone: formData.sms_phone,
      birth_form_id: formData.birth_form_id,
      is_orphan: formData.is_orphan === 'true',
      student_cast: formData.student_cast,
      is_osc: formData.is_osc === 'true',
      id_mark: formData.id_mark,
      previous_school: formData.previous_school,
      religion: formData.religion,
      blood_group: formData.blood_group,
      family_id: formData.family_id,
      disease: formData.disease,
      additional_note: formData.additional_note,
      total_siblings: parseInt(formData.total_siblings || '0'),
      address: formData.address,
      father_name: formData.father_name,
      father_cnic: formData.father_cnic,
      father_occupation: formData.father_occupation,
      father_education: formData.father_education,
      father_phone: formData.father_phone,
      father_profession: formData.father_profession,
      father_income: formData.father_income,
      mother_name: formData.mother_name,
      mother_cnic: formData.mother_cnic,
      mother_occupation: formData.mother_occupation,
      mother_education: formData.mother_education,
      mother_phone: formData.mother_phone,
      mother_profession: formData.mother_profession,
      mother_income: formData.mother_income,
      shift: formData.shift,
      group: formData.group,
      session_year: formData.session_year || new Date().getFullYear().toString(),
      ...(formData.batch_id ? { batch_id: formData.batch_id } : {}),
      ...(formData.course_slot ? { course_slot: formData.course_slot } : {}),
    });

  if (studentErr) {
    // If batch_id/course_slot columns do not exist yet (migration not applied), retry without them
    if (studentErr.message?.includes('batch_id') || studentErr.message?.includes('course_slot') || studentErr.code === '42703') {
      const { error: retryErr } = await adminClient
        .from('student_profiles')
        .insert({
          user_id: studentUserId,
          school_id: caller.school_id,
          campus_id: formData.campus_id || null,
          student_id: studentId,
          roll_number: rollNumber,
          cnic: formData.cnic,
          class_id: formData.class_id || null,
          section: formData.section,
          dob: formData.dob || null,
          gender: formData.gender,
          phone: formData.phone,
          fee_status: 'unpaid',
          registration_no: formData.registration_no,
          admission_date: formData.admission_date || new Date().toISOString().split('T')[0],
          fee_discount: parseFloat(formData.fee_discount || '0'),
          sms_phone: formData.sms_phone,
          birth_form_id: formData.birth_form_id,
          is_orphan: formData.is_orphan === 'true',
          student_cast: formData.student_cast,
          is_osc: formData.is_osc === 'true',
          id_mark: formData.id_mark,
          previous_school: formData.previous_school,
          religion: formData.religion,
          blood_group: formData.blood_group,
          family_id: formData.family_id,
          disease: formData.disease,
          additional_note: formData.additional_note,
          total_siblings: parseInt(formData.total_siblings || '0'),
          address: formData.address,
          father_name: formData.father_name,
          father_cnic: formData.father_cnic,
          father_occupation: formData.father_occupation,
          father_education: formData.father_education,
          father_phone: formData.father_phone,
          father_profession: formData.father_profession,
          father_income: formData.father_income,
          mother_name: formData.mother_name,
          mother_cnic: formData.mother_cnic,
          mother_occupation: formData.mother_occupation,
          mother_education: formData.mother_education,
          mother_phone: formData.mother_phone,
          mother_profession: formData.mother_profession,
          mother_income: formData.mother_income,
          shift: formData.shift,
          group: formData.group,
          session_year: formData.session_year || new Date().getFullYear().toString(),
        });
      if (retryErr) {
        await adminClient.from('profiles').delete().eq('id', studentUserId);
        await adminClient.auth.admin.deleteUser(studentUserId);
        return { error: 'Failed to save student details: ' + retryErr.message };
      }
    } else {
      console.error('Error inserting student_profiles, rolling back auth account and profile:', studentErr);
      await adminClient.from('profiles').delete().eq('id', studentUserId);
      await adminClient.auth.admin.deleteUser(studentUserId);
      return { error: 'Failed to save student details: ' + studentErr.message };
    }
  }

  revalidatePath('/admin/students');
  return { 
    success: true, 
    credentials: {
      email,
      password: formData.password || autoPassword,
      studentId,
      rollNumber
    }
  };
}

export async function createManualTeacher(formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can manually create teachers.' };
  }

  const email = formData.email;
  const fullName = formData.full_name;
  const autoPassword = Math.random().toString(36).slice(-8) + 'Tch!';
  const teacherId = await generateTeacherId();

  // 1. Create Auth Account
  const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: formData.password || autoPassword,
    email_confirm: true,
    user_metadata: { role: 'teacher', full_name: fullName, school_id: caller.school_id, status: 'approved' }
  });

  if (authError) return { error: 'Failed to create teacher auth: ' + authError.message };
  const teacherUserId = newAuthUser.user.id;

  // 2. Create Profile
  const { error: profError } = await adminClient.from('profiles').insert({
    id: teacherUserId,
    email: email,
    full_name: fullName,
    role: 'teacher',
    school_id: caller.school_id,
    status: 'approved',
    avatar_url: formData.avatar_url,
    phone: formData.phone,
    plain_password: formData.password || autoPassword
  });

  if (profError) {
    await adminClient.auth.admin.deleteUser(teacherUserId);
    return { error: 'Failed to create profile: ' + profError.message };
  }

  // 3. Create Teacher Profile record
  const { error: teacherErr } = await adminClient
    .from('teacher_profiles')
    .insert({
      user_id: teacherUserId,
      school_id: caller.school_id,
      campus_id: formData.campus_id || null,
      teacher_id: teacherId,
      is_class_teacher: formData.is_class_teacher === 'true',
      class_id: formData.class_id || null,
      qualification: formData.qualification,
      experience: formData.experience,
      cnic: formData.cnic,
      address: formData.address,
      gender: formData.gender,
      dob: formData.dob || null,
      city: formData.city,
      country: formData.country
    });

  if (teacherErr) {
    await adminClient.from('profiles').delete().eq('id', teacherUserId);
    await adminClient.auth.admin.deleteUser(teacherUserId);
    return { error: 'Failed to save teacher details: ' + teacherErr.message };
  }

  // 4. Handle Subject/Class Assignments if provided
  if (formData.assignments && Array.isArray(formData.assignments)) {
    const assignmentsToInsert = [];
    for (const a of formData.assignments) {
      if (!a.class_id) continue;
      
      let finalSubjectId = a.subject_id;
      
      // If "Other" was selected and custom_subject provided, create it first
      if (a.subject_id === 'other' && a.custom_subject) {
        const { data: newSubject, error: newSubjErr } = await adminClient
          .from('subjects')
          .insert({
            name: a.custom_subject,
            school_id: caller.school_id
          })
          .select()
          .single();
          
        if (newSubject) {
          finalSubjectId = newSubject.id;
        } else {
          console.error("Failed to create custom subject:", newSubjErr);
          continue; // Skip this assignment if subject creation failed
        }
      }

      if (finalSubjectId) {
        assignmentsToInsert.push({
          teacher_id: teacherUserId,
          class_id: a.class_id,
          subject_id: finalSubjectId,
          school_id: caller.school_id
        });
      }
    }
    
    if (assignmentsToInsert.length > 0) {
      const { error: assignErr } = await adminClient.from('teacher_assignments').insert(assignmentsToInsert);
      if (assignErr) {
        // Rollback
        await adminClient.from('teacher_profiles').delete().eq('user_id', teacherUserId);
        await adminClient.from('profiles').delete().eq('id', teacherUserId);
        await adminClient.auth.admin.deleteUser(teacherUserId);
        return { error: 'Failed to save assignments: ' + assignErr.message };
      }
    }
  }

  revalidatePath('/admin/teachers');
  return { 
    success: true, 
    credentials: {
      email,
      password: formData.password || autoPassword,
      teacherId
    }
  };
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
export async function getTeacherProfiles(filters?: { query?: string; status?: string; campus_id?: string }) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized' };
  }

  let query = adminClient
    .from('teacher_profiles')
    .select(`
      *,
      profiles(id, full_name, email, avatar_url, phone, status)
    `)
    .eq('school_id', caller.school_id);

  if (filters?.status && filters.status !== 'all') {
    // This is tricky because status is in profiles table. 
    // We can filter after fetching or use a join-based filter if possible.
  }
  
  if (filters?.campus_id) {
    query = query.eq('campus_id', filters.campus_id);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };

  let result = data;
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    result = result.filter((t: any) => 
      t.profiles?.full_name?.toLowerCase().includes(q) ||
      t.profiles?.email?.toLowerCase().includes(q) ||
      t.teacher_id?.toLowerCase().includes(q)
    );
  }

  return { data: result, error: null };
}

export async function updateOrDeleteTeacherProfile(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized' };
  }

  const teacherUserId = formData.get('user_id') as string;
  const fullName = formData.get('full_name') as string;

  await adminClient.from('profiles').update({
    full_name: fullName,
    phone: formData.get('phone') as string,
    avatar_url: formData.get('avatar_url') as string,
    updated_at: new Date().toISOString()
  }).eq('id', teacherUserId);

  const teacherData: any = {
    user_id: teacherUserId,
    school_id: caller.school_id,
    teacher_id: formData.get('teacher_id'),
    is_class_teacher: formData.get('is_class_teacher') === 'true',
    class_id: formData.get('class_id') || null,
    qualification: formData.get('qualification'),
    experience: formData.get('experience'),
    address: formData.get('address'),
    cnic: formData.get('cnic') || null,
    gender: formData.get('gender') || null,
    city: formData.get('city') || null,
    state: formData.get('state') || null,
    country: formData.get('country') || null,
    blood_group: formData.get('blood_group') || null,
    dob: formData.get('dob') || null,
    campus_id: formData.get('campus_id') || null,
  };

  const { error: teacherErr } = await adminClient
    .from('teacher_profiles')
    .upsert(teacherData, { onConflict: 'user_id' });

  if (teacherErr) return { error: 'Failed to save teacher details: ' + teacherErr.message };

  revalidatePath('/admin/teachers');
  return { success: true };
}

/**
 * Super Admin manually creates an Admin account for a school.
 */
export async function createManualAdmin(formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'super_admin') {
    return { error: 'Unauthorized: Only Super Admin can create Admin accounts.' };
  }

  const email = formData.email.toLowerCase();
  const fullName = formData.full_name;
  const schoolId = formData.school_id;
  const autoPassword = Math.random().toString(36).slice(-8) + 'Adm@123';

  // 1. Create Auth Account
  const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: formData.password || autoPassword,
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: fullName, school_id: schoolId, status: 'approved' }
  });

  if (authError) return { error: 'Auth Error: ' + authError.message };
  const adminUserId = newAuthUser.user.id;

  // 2. Create Profile
  const { error: profileErr } = await adminClient.from('profiles').insert({
    id: adminUserId,
    email: email,
    full_name: fullName,
    role: 'admin',
    school_id: schoolId,
    status: 'approved',
    phone: formData.phone,
    cnic: formData.cnic,
    plain_password: formData.password || autoPassword
  });

  if (profileErr) return { error: 'Profile Database Error: ' + profileErr.message };

  // 3. Create admin_campuses record
  const { error: adminErr } = await adminClient.from('admin_campuses').insert({
    admin_id: adminUserId,
    school_id: schoolId,
    is_primary: true
  });

  if (adminErr) {
    // Cleanup if this fails
    await adminClient.from('profiles').delete().eq('id', adminUserId);
    await adminClient.auth.admin.deleteUser(adminUserId);
    return { error: 'Campus Assignment Error: ' + adminErr.message };
  }

  // 4. Update the school with the new admin_id
  await adminClient.from('schools').update({ admin_id: adminUserId }).eq('id', schoolId);

  revalidatePath('/super-admin/admins');
  return { 
    success: true, 
    credentials: {
      email,
      password: formData.password || autoPassword
    }
  };
}

export async function deleteStudent(studentUserId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Get caller profile to check permission
  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can delete students.' };
  }

  // 1. Delete student_profiles
  const { error: studentErr } = await adminClient
    .from('student_profiles')
    .delete()
    .eq('user_id', studentUserId);

  if (studentErr) {
    console.error('Error deleting student profile:', studentErr);
    return { error: 'Failed to delete student profile details: ' + studentErr.message };
  }

  // 2. Delete profiles
  const { error: profileErr } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', studentUserId);

  if (profileErr) {
    console.error('Error deleting profile:', profileErr);
    return { error: 'Failed to delete user profile: ' + profileErr.message };
  }

  // 3. Delete auth account
  const { error: authErr } = await adminClient.auth.admin.deleteUser(studentUserId);
  if (authErr) {
    console.error('Error deleting auth account:', authErr);
    return { error: 'Failed to delete authentication account: ' + authErr.message };
  }

  revalidatePath('/admin/students');
  return { success: true };
}

export async function deleteTeacher(teacherUserId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can delete teachers.' };
  }

  // 1. Delete teacher_assignments
  await adminClient
    .from('teacher_assignments')
    .delete()
    .eq('teacher_id', teacherUserId);

  // 2. Delete teacher_profiles
  const { error: teacherErr } = await adminClient
    .from('teacher_profiles')
    .delete()
    .eq('user_id', teacherUserId);

  if (teacherErr) {
    console.error('Error deleting teacher profile:', teacherErr);
    return { error: 'Failed to delete teacher profile details: ' + teacherErr.message };
  }

  // 3. Delete profiles
  const { error: profileErr } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', teacherUserId);

  if (profileErr) {
    console.error('Error deleting profile:', profileErr);
    return { error: 'Failed to delete user profile: ' + profileErr.message };
  }

  // 4. Delete auth account
  const { error: authErr } = await adminClient.auth.admin.deleteUser(teacherUserId);
  if (authErr) {
    console.error('Error deleting auth account:', authErr);
    return { error: 'Failed to delete authentication account: ' + authErr.message };
  }

  revalidatePath('/admin/teachers');
  return { success: true };
}

/**
 * Reset a user's password to a new value or auto-generated secure string.
 */
export async function resetUserPassword(userId: string, newPassword?: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can reset passwords.' };
  }

  const passwordToSet = newPassword || Math.random().toString(36).slice(-8) + 'Sc@1';

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    password: passwordToSet
  });

  if (error) return { error: error.message };

  await adminClient.from('profiles').update({ plain_password: passwordToSet }).eq('id', userId);

  return { success: true, newPassword: passwordToSet };
}

/**
 * Toggle user account enabled/disabled status.
 */
export async function toggleUserStatus(userId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can toggle account status.' };
  }

  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('status, role')
    .eq('id', userId)
    .single();

  if (!targetProfile) return { error: 'User profile not found' };

  const newStatus = targetProfile.status === 'disabled' ? 'approved' : 'disabled';

  const { error: updateErr } = await adminClient
    .from('profiles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateErr) return { error: updateErr.message };

  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { status: newStatus }
  });

  revalidatePath('/admin/students');
  revalidatePath('/admin/teachers');

  return { success: true, status: newStatus };
}

/**
 * Fetch detailed login & auth details for admin review.
 */
export async function getUserLoginDetails(userId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { data: null, error: 'Unauthorized: Only admins can view login details.' };
  }

  const { data: authUser, error: authErr } = await adminClient.auth.admin.getUserById(userId);

  if (authErr || !authUser.user) return { data: null, error: 'Auth user not found' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, role, status')
    .eq('id', userId)
    .single();

  return {
    data: {
      id: authUser.user.id,
      email: authUser.user.email,
      fullName: profile?.full_name || authUser.user.user_metadata?.full_name,
      role: profile?.role || authUser.user.user_metadata?.role,
      status: profile?.status || authUser.user.user_metadata?.status,
      lastSignInAt: authUser.user.last_sign_in_at,
      createdAt: authUser.user.created_at
    },
    error: null
  };
}

/**
 * Comprehensive update for a manual student profile (all fields).
 */
export async function updateManualStudentData(userId: string, formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can update student records.' };
  }

  // 1. Update profiles table
  const studentProfileUpdate: any = {
    full_name: formData.full_name,
    email: formData.email,
    phone: formData.phone,
    avatar_url: formData.avatar_url,
    updated_at: new Date().toISOString()
  };
  if (formData.password) {
    studentProfileUpdate.plain_password = formData.password;
  }

  const { error: profileErr } = await adminClient
    .from('profiles')
    .update(studentProfileUpdate)
    .eq('id', userId);

  if (profileErr) return { error: 'Failed to update profile: ' + profileErr.message };

  // 2. Update auth email & password if changed
  const updateAuth: any = {};
  if (formData.email) updateAuth.email = formData.email;
  if (formData.password) updateAuth.password = formData.password;
  if (formData.full_name) updateAuth.user_metadata = { full_name: formData.full_name };

  if (Object.keys(updateAuth).length > 0) {
    await adminClient.auth.admin.updateUserById(userId, updateAuth);
  }

  // 3. Update student_profiles
  const { error: studentErr } = await adminClient
    .from('student_profiles')
    .update({
      campus_id: formData.campus_id || null,
      roll_number: formData.roll_number,
      cnic: formData.cnic,
      class_id: formData.class_id || null,
      section: formData.section,
      dob: formData.dob || null,
      gender: formData.gender,
      phone: formData.phone,
      registration_no: formData.registration_no,
      admission_date: formData.admission_date || null,
      fee_discount: parseFloat(formData.fee_discount || '0'),
      sms_phone: formData.sms_phone,
      birth_form_id: formData.birth_form_id,
      is_orphan: formData.is_orphan === 'true',
      student_cast: formData.student_cast,
      is_osc: formData.is_osc === 'true',
      id_mark: formData.id_mark,
      previous_school: formData.previous_school,
      religion: formData.religion,
      blood_group: formData.blood_group,
      family_id: formData.family_id,
      disease: formData.disease,
      additional_note: formData.additional_note,
      total_siblings: parseInt(formData.total_siblings || '0'),
      address: formData.address,
      father_name: formData.father_name,
      father_cnic: formData.father_cnic,
      father_occupation: formData.father_occupation,
      father_education: formData.father_education,
      father_phone: formData.father_phone,
      father_profession: formData.father_profession,
      father_income: formData.father_income,
      mother_name: formData.mother_name,
      mother_cnic: formData.mother_cnic,
      mother_occupation: formData.mother_occupation,
      mother_education: formData.mother_education,
      mother_phone: formData.mother_phone,
      mother_profession: formData.mother_profession,
      mother_income: formData.mother_income,
      shift: formData.shift,
      group: formData.group,
      session_year: formData.session_year || new Date().getFullYear().toString(),
      ...(formData.batch_id !== undefined ? { batch_id: formData.batch_id || null } : {}),
      ...(formData.course_slot !== undefined ? { course_slot: formData.course_slot || null } : {}),
    })
    .eq('user_id', userId);

  if (studentErr) {
    // Retry without batch_id/course_slot if columns do not exist yet
    if (studentErr.message?.includes('batch_id') || studentErr.message?.includes('course_slot') || studentErr.code === '42703') {
      const { error: retryErr } = await adminClient
        .from('student_profiles')
        .update({
          campus_id: formData.campus_id || null,
          roll_number: formData.roll_number,
          cnic: formData.cnic,
          class_id: formData.class_id || null,
          section: formData.section,
          dob: formData.dob || null,
          gender: formData.gender,
          phone: formData.phone,
          registration_no: formData.registration_no,
          admission_date: formData.admission_date || null,
          fee_discount: parseFloat(formData.fee_discount || '0'),
          sms_phone: formData.sms_phone,
          birth_form_id: formData.birth_form_id,
          is_orphan: formData.is_orphan === 'true',
          student_cast: formData.student_cast,
          is_osc: formData.is_osc === 'true',
          id_mark: formData.id_mark,
          previous_school: formData.previous_school,
          religion: formData.religion,
          blood_group: formData.blood_group,
          family_id: formData.family_id,
          disease: formData.disease,
          additional_note: formData.additional_note,
          total_siblings: parseInt(formData.total_siblings || '0'),
          address: formData.address,
          father_name: formData.father_name,
          father_cnic: formData.father_cnic,
          father_occupation: formData.father_occupation,
          father_education: formData.father_education,
          father_phone: formData.father_phone,
          father_profession: formData.father_profession,
          father_income: formData.father_income,
          mother_name: formData.mother_name,
          mother_cnic: formData.mother_cnic,
          mother_occupation: formData.mother_occupation,
          mother_education: formData.mother_education,
          mother_phone: formData.mother_phone,
          mother_profession: formData.mother_profession,
          mother_income: formData.mother_income,
          shift: formData.shift,
          group: formData.group,
          session_year: formData.session_year || new Date().getFullYear().toString(),
        })
        .eq('user_id', userId);
      if (retryErr) return { error: 'Failed to update student details: ' + retryErr.message };
    } else {
      return { error: 'Failed to update student details: ' + studentErr.message };
    }
  }

  revalidatePath('/admin/students');
  return { success: true };
}

/**
 * Comprehensive update for a manual teacher profile (all fields).
 */
export async function updateManualTeacherData(userId: string, formData: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized: Only admins can update teacher records.' };
  }

  // 1. Update profiles table
  const teacherProfileUpdate: any = {
    full_name: formData.full_name,
    email: formData.email,
    phone: formData.phone,
    avatar_url: formData.avatar_url,
    updated_at: new Date().toISOString()
  };
  if (formData.password) {
    teacherProfileUpdate.plain_password = formData.password;
  }

  const { error: profileErr } = await adminClient
    .from('profiles')
    .update(teacherProfileUpdate)
    .eq('id', userId);

  if (profileErr) return { error: 'Failed to update profile: ' + profileErr.message };

  // 2. Update auth email & password if changed
  const updateAuth: any = {};
  if (formData.email) updateAuth.email = formData.email;
  if (formData.password) updateAuth.password = formData.password;
  if (formData.full_name) updateAuth.user_metadata = { full_name: formData.full_name };

  if (Object.keys(updateAuth).length > 0) {
    await adminClient.auth.admin.updateUserById(userId, updateAuth);
  }

  // 3. Update teacher_profiles
  const { error: teacherErr } = await adminClient
    .from('teacher_profiles')
    .update({
      campus_id: formData.campus_id || null,
      teacher_id: formData.teacher_id,
      is_class_teacher: formData.is_class_teacher === 'true',
      class_id: formData.class_id || null,
      qualification: formData.qualification,
      experience: formData.experience,
      cnic: formData.cnic,
      address: formData.address,
      gender: formData.gender,
      dob: formData.dob || null,
      city: formData.city,
      country: formData.country
    })
    .eq('user_id', userId);

  if (teacherErr) return { error: 'Failed to update teacher details: ' + teacherErr.message };

  // 4. Update assignments if provided
  if (formData.assignments && Array.isArray(formData.assignments)) {
    // Clear old assignments
    await adminClient.from('teacher_assignments').delete().eq('teacher_id', userId);

    const assignmentsToInsert = [];
    for (const a of formData.assignments) {
      if (!a.class_id) continue;
      let finalSubjectId = a.subject_id;
      if (a.subject_id === 'other' && a.custom_subject) {
        const { data: newSubj } = await adminClient
          .from('subjects')
          .insert({ name: a.custom_subject, school_id: caller.school_id })
          .select()
          .single();
        if (newSubj) finalSubjectId = newSubj.id;
      }
      if (finalSubjectId) {
        assignmentsToInsert.push({
          teacher_id: userId,
          class_id: a.class_id,
          subject_id: finalSubjectId,
          school_id: caller.school_id
        });
      }
    }
    if (assignmentsToInsert.length > 0) {
      await adminClient.from('teacher_assignments').insert(assignmentsToInsert);
    }
  }

  revalidatePath('/admin/teachers');
  return { success: true };
}


