/**
 * TypeScript type definitions for all database tables.
 * Mirrors the Supabase schema.
 */

import type { UserRole, UserStatus } from '@/app/_lib/utils/constants';

// ─── Profiles ────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Schools ─────────────────────────────────────────────────────────────────
export interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  admin_id: string | null;
  created_at: string;
}

// ─── Classes ─────────────────────────────────────────────────────────────────
export interface Class {
  id: string;
  name: string;
  section: string | null;
  school_id: string;
  class_teacher_id: string | null;
  created_at: string;
}

// ─── Subjects ────────────────────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
}

// ─── Teacher Profiles ────────────────────────────────────────────────────────
export interface TeacherProfile {
  id: string;
  user_id: string;
  is_class_teacher: boolean;
  class_id: string | null;
  school_id: string;
  created_at: string;
}

// ─── Teacher-Subject Mapping ─────────────────────────────────────────────────
export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
}

// ─── Student Profiles ────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string;
  user_id: string;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  school_id: string;
  admin_approved: boolean;
  teacher_approved: boolean;
  created_at: string;
}

// ─── Timetable ───────────────────────────────────────────────────────────────
export interface Timetable {
  id: string;
  class_id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  school_id: string;
  created_at: string;
}

// ─── Exam Timetable ──────────────────────────────────────────────────────────
export interface ExamTimetable {
  id: string;
  title: string;
  class_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  school_id: string;
  created_at: string;
}

// ─── Assignments ─────────────────────────────────────────────────────────────
export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  deadline: string;
  school_id: string;
  created_at: string;
}

// ─── Attendance ──────────────────────────────────────────────────────────────
export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  method: 'manual' | 'qr';
  school_id: string;
  created_at: string;
}

// ─── Results ─────────────────────────────────────────────────────────────────
export interface Result {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  marks: number;
  total_marks: number;
  grade: string | null;
  exam_name: string | null;
  teacher_id: string;
  school_id: string;
  created_at: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// ─── Announcements ──────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  school_id: string;
  target_role: string | null;
  created_at: string;
}

// ─── Conversations & Messages ────────────────────────────────────────────────
export interface Conversation {
  id: string;
  created_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ─── Extended types with joins ───────────────────────────────────────────────
export interface ProfileWithSchool extends Profile {
  school?: School | null;
}

export interface MessageWithSender extends Message {
  sender?: Profile;
}

export interface ConversationWithDetails extends Conversation {
  participants?: (ConversationParticipant & { profile?: Profile })[];
  last_message?: Message;
}

export interface AssignmentWithDetails extends Assignment {
  subject?: Subject;
  class?: Class;
  teacher?: Profile;
}

export interface ResultWithDetails extends Result {
  subject?: Subject;
  student?: Profile;
}

export interface AttendanceWithStudent extends Attendance {
  student?: Profile;
}
