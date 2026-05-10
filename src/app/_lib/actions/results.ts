'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { createClient } from '@/app/_lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Fetch teacher's assigned subjects and classes
export async function getTeacherAssignments() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 1. Fetch raw assignments
  const { data: assignments, error } = await adminClient
    .from('teacher_assignments')
    .select('*')
    .eq('teacher_id', user.id);

  if (error) return { error: error.message };
  if (!assignments || assignments.length === 0) return { data: [] };

  // 2. Fetch subjects and classes manually
  const subjectIds = [...new Set(assignments.map(a => a.subject_id))];
  const classIds = [...new Set(assignments.map(a => a.class_id))];

  const [{ data: subjects }, { data: classes }] = await Promise.all([
    adminClient.from('subjects').select('id, name').in('id', subjectIds),
    adminClient.from('classes').select('id, name, section').in('id', classIds)
  ]);

  const subjectMap = (subjects || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s }), {});
  const classMap = (classes || []).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c }), {});

  // 3. Map back
  const mappedData = assignments.map(a => ({
    ...a,
    subjects: subjectMap[a.subject_id],
    classes: classMap[a.class_id]
  }));

  return { data: mappedData };
}

export async function checkIfClassTeacher() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isClassTeacher: false };

  const { data } = await adminClient
    .from('teacher_profiles')
    .select('is_class_teacher')
    .eq('user_id', user.id)
    .single();
    
  return { isClassTeacher: !!data?.is_class_teacher };
}

// Fetch students for a specific class
export async function getClassStudents(classId: string) {
  const adminClient = createAdminClient();
  
  // 1. Fetch student profiles basic info
  const { data: students, error } = await adminClient
    .from('student_profiles')
    .select('user_id, roll_number')
    .eq('class_id', classId);

  if (error) return { error: error.message };
  if (!students || students.length === 0) return { data: [] };

  // 2. Fetch full names from profiles manually
  const userIds = students.map(s => s.user_id);
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  const profileMap = (profiles || []).reduce((acc: any, p: any) => {
    acc[p.id] = p.full_name;
    return acc;
  }, {});

  // 3. Map names back
  const mappedStudents = students.map(s => ({
    ...s,
    profiles: { full_name: profileMap[s.user_id] || 'Unknown Student' }
  }));

  return { data: mappedStudents };
}

// Add a student manually (creates a dummy auth and profile record to satisfy FK constraints)
export async function addManualStudent(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const fullName = formData.get('full_name') as string;
  const rollNumber = formData.get('roll_number') as string;
  const classId = formData.get('class_id') as string;
  
  const { data: currentProfile } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();
  const schoolId = currentProfile?.school_id;

  // 0. Check if student already exists by roll number WITHIN THIS CLASS
  const { data: existingStudent } = await adminClient
    .from('student_profiles')
    .select('user_id')
    .eq('roll_number', rollNumber)
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (existingStudent) {
    return { error: `Roll Number ${rollNumber} is already assigned to another student in this class.` };
  }
  
  // Create dummy email
  const dummyEmail = `manual.${rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.local`;
  
  // 1. Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: dummyEmail,
    password: 'ManualStudentPassword123!',
    email_confirm: true,
  });

  if (authError) return { error: authError.message };
  const newUserId = authData.user.id;

  // 2. Create profile
  await adminClient.from('profiles').insert({
    id: newUserId,
    school_id: schoolId,
    full_name: fullName,
    role: 'student',
  });

  // 3. Create student profile
  const { error: studentErr } = await adminClient.from('student_profiles').insert({
    user_id: newUserId,
    school_id: schoolId,
    class_id: classId,
    roll_number: rollNumber,
  });

  if (studentErr) return { error: studentErr.message };
  
  return { success: true };
}

// Save a single student's subject result
export async function saveSubjectResult(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const studentId = formData.get('student_id') as string;
  const classId = formData.get('class_id') as string;
  const subjectId = formData.get('subject_id') as string;
  const marksObtained = parseFloat(formData.get('marks_obtained') as string);
  const totalMarks = parseFloat(formData.get('total_marks') as string);
  const term = formData.get('term') as string || 'Final Term';

  // Basic grade calculation
  const percentage = (marksObtained / totalMarks) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  const { data: profile, error: profileErr } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();
  
  if (profileErr || !profile?.school_id) {
    return { error: 'Failed to identify your school profile. Please ensure your profile is finalized.' };
  }

  if (isNaN(marksObtained) || isNaN(totalMarks)) {
    return { error: 'Invalid marks entered. Please enter numeric values.' };
  }

  // Check if result already exists to manually handle upsert without a DB constraint
  const { data: existingResult } = await adminClient
    .from('results')
    .select('id')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .eq('exam_name', term)
    .maybeSingle();

  let error;
  if (existingResult) {
    const { error: updateErr } = await adminClient
      .from('results')
      .update({
        marks: marksObtained,
        total_marks: totalMarks,
        grade,
        teacher_id: user.id,
        school_id: profile.school_id
      })
      .eq('id', existingResult.id);
    error = updateErr;
  } else {
    const { error: insertErr } = await adminClient
      .from('results')
      .insert({
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: user.id,
        school_id: profile.school_id,
        marks: marksObtained,
        total_marks: totalMarks,
        grade,
        exam_name: term
      });
    error = insertErr;
  }

  if (error) {
    console.error('Result Save Error:', error);
    return { error: 'Database error: ' + error.message };
  }
  revalidatePath('/teacher/results');
  return { success: true };
}

// Fetch all subject results for a class (For Class Teacher)
export async function getClassResults(classId: string, term: string = 'Final Term') {
  const adminClient = createAdminClient();
  
  // 1. Fetch raw results first
  const { data: results, error } = await adminClient
    .from('results')
    .select('*, subjects(name)')
    .eq('class_id', classId)
    .eq('exam_name', term);

  if (error) {
    console.error('getClassResults error:', error);
    return { error: error.message };
  }

  if (!results || results.length === 0) return { data: [] };

  // 2. Fetch profile names
  const studentIds = [...new Set(results.map(r => r.student_id))];
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  const nameMap = (profiles || []).reduce((acc: any, p: any) => {
    acc[p.id] = p.full_name;
    return acc;
  }, {});

  // 3. Fetch roll numbers from student_profiles
  const { data: studentProfiles } = await adminClient
    .from('student_profiles')
    .select('user_id, roll_number')
    .in('user_id', studentIds);

  const rollMap = (studentProfiles || []).reduce((acc: any, sp: any) => {
    acc[sp.user_id] = sp.roll_number;
    return acc;
  }, {});

  // 4. Map everything back to results in the format the component expects
  const resultsWithProfiles = results.map(r => ({
    ...r,
    profiles: {
      full_name: nameMap[r.student_id] || 'Unknown Student',
      student_profiles: [{ roll_number: rollMap[r.student_id] || '-' }]
    }
  }));
  
  return { data: resultsWithProfiles };
}

// Fetch existing marks for a specific subject and class
export async function getSubjectResults(classId: string, subjectId: string, term: string = 'Final Term') {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('results')
    .select('student_id, marks, total_marks')
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .eq('exam_name', term);

  if (error) return { error: error.message };
  return { data };
}

// Compile and merge final results
export async function publishFinalResults(classId: string, term: string = 'Final Term') {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();

  // 1. Get all subject results for this class
  const { data: results } = await adminClient
    .from('results')
    .select('*')
    .eq('class_id', classId)
    .eq('exam_name', term);

  if (!results || results.length === 0) return { error: 'No results found to merge' };

  // 2. Group by student
  const studentResults: Record<string, { total: number, obtained: number }> = {};
  
  results.forEach(r => {
    const marks = parseFloat(r.marks) || 0;
    const total = parseFloat(r.total_marks) || 100;
    
    if (!studentResults[r.student_id]) {
      studentResults[r.student_id] = { total: 0, obtained: 0 };
    }
    studentResults[r.student_id].total += total;
    studentResults[r.student_id].obtained += marks;
  });

  // 3. Upsert final results
  const finalResultsToInsert = Object.keys(studentResults).map(studentId => {
    const sr = studentResults[studentId];
    const percentage = (sr.obtained / sr.total) * 100;
    
    let finalGrade = 'F';
    if (percentage >= 90) finalGrade = 'A+';
    else if (percentage >= 80) finalGrade = 'A';
    else if (percentage >= 70) finalGrade = 'B';
    else if (percentage >= 60) finalGrade = 'C';
    else if (percentage >= 50) finalGrade = 'D';

    return {
      student_id: studentId,
      class_id: classId,
      school_id: profile?.school_id,
      total_marks: sr.total,
      obtained_marks: sr.obtained,
      percentage: parseFloat(percentage.toFixed(2)),
      final_grade: finalGrade,
      term,
      published_by: user.id
    };
  });

  const { error } = await adminClient
    .from('final_results')
    .upsert(finalResultsToInsert, { onConflict: 'student_id, term' });

  if (error) return { error: error.message };
  revalidatePath('/teacher/results/publish');
  return { success: true };
}

// Fetch student's final result
export async function getStudentFinalResult() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Fetch final result with basic info first to avoid relation cache errors
  const { data, error } = await adminClient
    .from('final_results')
    .select('*')
    .eq('student_id', user.id)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getStudentFinalResult error:', error.message);
    return { error: error.message };
  }

  if (!data) return { data: null };

  // Fetch publisher profile manually
  if (data.published_by) {
    const { data: publisher } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', data.published_by)
      .single();
    if (publisher) data.publisher = publisher;
  }

  // Fetch the subject-wise breakdown using adminClient
  const { data: breakdown } = await adminClient
    .from('results')
    .select('*, subjects:subject_id(name)')
    .eq('student_id', user.id)
    .eq('exam_name', data.term);

  return { data, breakdown: breakdown || [], error: null };
}
