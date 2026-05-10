"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";

export async function createAssignment(data: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    throw new Error("Only teachers can create assignments");
  }

  const title = data.get("title") as string;
  const description = data.get("description") as string;
  const subject_id = data.get("subject_id") as string;
  const class_id = data.get("class_id") as string;
  const deadline = data.get("deadline") as string;
  const max_marks = parseInt(data.get("max_marks") as string, 10);
  const attachment_url = data.get("attachment_url") as string || null;

  if (!title || !subject_id || !class_id || !deadline) {
    throw new Error("Missing required fields");
  }

  const { data: assignment, error } = await adminClient
    .from("assignments")
    .insert({
      title,
      description,
      subject_id,
      class_id,
      teacher_id: user.id,
      deadline,
      max_marks: max_marks || null,
      attachment_url,
      school_id: profile.school_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating assignment:", error);
    throw new Error(error.message);
  }

  revalidatePath("/teacher/assignments");
  return assignment;
}

export async function getTeacherAssignments(classId?: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = adminClient
    .from("assignments")
    .select(`
      *,
      subject:subjects(name),
      class:classes(name, section)
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (classId) {
    query = query.eq("class_id", classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching teacher assignments:", error);
    return [];
  }

  return data;
}

export async function getStudentAssignments() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Get student's class from student_profiles table
  const { data: student } = await adminClient
    .from("student_profiles")
    .select("class_id")
    .eq("user_id", user.id)
    .single();

  if (!student?.class_id) return [];

  const { data: assignments, error } = await adminClient
    .from("assignments")
    .select(`
      *,
      subject:subjects(name)
    `)
    .eq("class_id", student.class_id)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching student assignments:", error.message || error);
    return [];
  }

  // Fetch teacher profiles manually to avoid strict foreign key relation errors
  const teacherIds = [...new Set(assignments.map(a => a.teacher_id).filter(Boolean))];
  let teacherMap: Record<string, string> = {};
  
  if (teacherIds.length > 0) {
    const { data: teachers } = await adminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", teacherIds);
      
    if (teachers) {
      teacherMap = teachers.reduce((acc, t) => {
        acc[t.id] = t.full_name;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // Fetch submissions manually to avoid missing table schema errors
  const assignmentIds = assignments.map(a => a.id);
  let submissionsMap: Record<string, any[]> = {};
  
  if (assignmentIds.length > 0) {
    const { data: allSubmissions, error: subError } = await adminClient
      .from("assignment_submissions")
      .select("status, marks, student_id, assignment_id")
      .eq("student_id", user.id)
      .in("assignment_id", assignmentIds);
      
    if (!subError && allSubmissions) {
      submissionsMap = allSubmissions.reduce((acc, sub) => {
        if (!acc[sub.assignment_id]) acc[sub.assignment_id] = [];
        acc[sub.assignment_id].push(sub);
        return acc;
      }, {} as Record<string, any[]>);
    }
  }

  // Filter submissions to only show the current student's and attach teacher name
  const mappedAssignments = assignments.map(a => ({
    ...a,
    teacher: { full_name: teacherMap[a.teacher_id] || 'Unknown Teacher' },
    submissions: submissionsMap[a.id] || []
  }));

  return mappedAssignments;
}

export async function getAssignmentDetails(id: string) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from("assignments")
    .select(`
      *,
      subject:subjects(name),
      class:classes(name, section)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching assignment details:", error.message || error);
    return null;
  }

  // Fetch teacher manually
  if (data?.teacher_id) {
    const { data: teacher } = await adminClient
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", data.teacher_id)
      .single();
    
    if (teacher) {
      data.teacher = teacher;
    }
  }

  return data;
}

export async function submitAssignment(data: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const assignment_id = data.get("assignment_id") as string;
  const file_url = data.get("file_url") as string || null;
  const text_answer = data.get("text_answer") as string || null;

  if (!assignment_id) throw new Error("Missing assignment ID");

  // Check deadline
  const { data: assignment } = await adminClient
    .from("assignments")
    .select("deadline")
    .eq("id", assignment_id)
    .single();

  const isLate = assignment?.deadline && new Date() > new Date(assignment.deadline);
  
  const status = isLate ? 'late' : 'submitted';

  const { data: submission, error } = await adminClient
    .from("assignment_submissions")
    .upsert({
      assignment_id,
      student_id: user.id,
      file_url,
      text_answer,
      status,
    }, { onConflict: 'assignment_id,student_id' })
    .select()
    .single();

  if (error) {
    console.error("Error submitting assignment:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/student/assignments/${assignment_id}`);
  return submission;
}

export async function getAssignmentSubmissions(assignmentId: string) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from("assignment_submissions")
    .select(`
      *,
      student:profiles!student_id(full_name, avatar_url, email)
    `)
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  return data;
}

export async function gradeSubmission(submissionId: string, marks: number, feedback: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    throw new Error("Only teachers or admins can grade submissions");
  }

  const { data, error } = await adminClient
    .from("assignment_submissions")
    .update({
      marks,
      feedback,
      status: 'graded',
      updated_at: new Date().toISOString()
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    console.error("Error grading submission:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function getStudentSubmission(assignmentId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await adminClient
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching submission:", error);
    return null;
  }

  return data;
}

