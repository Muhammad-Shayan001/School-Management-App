/**
 * Application-wide constants for the School Management System.
 */

// User roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// User statuses
export const STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type UserStatus = (typeof STATUSES)[keyof typeof STATUSES];

// Class names (1-10)
export const CLASS_NAMES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
] as const;

// Days of the week for timetable
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

// Attendance methods
export const ATTENDANCE_METHOD = {
  MANUAL: 'manual',
  QR: 'qr',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  APPROVAL: 'approval',
  MESSAGE: 'message',
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
} as const;

// Role labels for display
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin (Principal)',
  teacher: 'Teacher',
  student: 'Student',
};

// Status labels with colors
export const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
};

// Dashboard routes per role
export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
};

// Sidebar navigation items per role
export const SIDEBAR_NAV: Record<
  UserRole,
  Array<{ label: string; href: string; icon: string }>
> = {
  super_admin: [
    { label: 'Dashboard', href: '/super-admin', icon: 'LayoutDashboard' },
    { label: 'Approvals', href: '/super-admin/approvals', icon: 'UserCheck' },
    { label: 'Schools', href: '/super-admin/schools', icon: 'School' },
    { label: 'Settings', href: '/super-admin/settings', icon: 'Settings' },
    { label: 'My Profile', href: '/profile', icon: 'User' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Attendance', href: '/admin/attendance', icon: 'ClipboardCheck' },
    { label: 'Teachers', href: '/admin/teachers', icon: 'GraduationCap' },
    { label: 'Students', href: '/admin/students', icon: 'Users' },
    { label: 'Announcements', href: '/admin/announcements', icon: 'Megaphone' },
    { label: 'Timetable', href: '/admin/timetable', icon: 'Calendar' },
    { label: 'Exam Schedule', href: '/admin/exam-timetable', icon: 'ClipboardList' },
    { label: 'Syllabus', href: '/admin/syllabus', icon: 'BookOpen' },
    { label: 'ID Card', href: '/admin/id-card', icon: 'CreditCard' },
    { label: 'My Profile', href: '/profile', icon: 'User' },
    { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
  ],
  teacher: [
    { label: 'Dashboard', href: '/teacher', icon: 'LayoutDashboard' },
    { label: 'Attendance', href: '/teacher/attendance', icon: 'ClipboardCheck' },
    { label: 'Students', href: '/teacher/students', icon: 'Users' },
    { label: 'Timetable', href: '/teacher/timetable', icon: 'Calendar' },
    { label: 'Exam Schedule', href: '/teacher/exam-timetable', icon: 'ClipboardList' },
    { label: 'Syllabus', href: '/teacher/syllabus', icon: 'BookOpen' },
    { label: 'Assignments', href: '/teacher/assignments', icon: 'FileText' },
    { label: 'Results', href: '/teacher/results', icon: 'BarChart3' },
    { label: 'Announcements', href: '/teacher/announcements', icon: 'Megaphone' },
    { label: 'ID Card', href: '/teacher/id-card', icon: 'CreditCard' },
    { label: 'My Profile', href: '/profile', icon: 'User' },
    { label: 'Settings', href: '/teacher/settings', icon: 'Settings' },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: 'LayoutDashboard' },
    { label: 'Attendance', href: '/student/attendance', icon: 'ClipboardCheck' },
    { label: 'Results', href: '/student/results', icon: 'BarChart3' },
    { label: 'Timetable', href: '/student/timetable', icon: 'Calendar' },
    { label: 'Exam Schedule', href: '/student/exam-timetable', icon: 'ClipboardList' },
    { label: 'Syllabus', href: '/student/syllabus', icon: 'BookOpen' },
    { label: 'Announcements', href: '/student/announcements', icon: 'Megaphone' },
    { label: 'Assignments', href: '/student/assignments', icon: 'FileText' },
    { label: 'ID Card', href: '/student/id-card', icon: 'CreditCard' },
    { label: 'My Profile', href: '/profile', icon: 'User' },
    { label: 'Settings', href: '/student/settings', icon: 'Settings' },
  ],
};
