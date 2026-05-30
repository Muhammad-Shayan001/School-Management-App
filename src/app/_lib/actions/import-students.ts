'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedStudent {
  id: string;
  name: string;
  roll_number: string;
  class_name: string;
  section: string;
  father_name: string;
  mobile: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  status: 'valid' | 'error' | 'duplicate';
  errors: string[];
}

export interface ImportResultDetail {
  name: string;
  roll_number: string;
  status: 'success' | 'failed' | 'duplicate' | 'skipped';
  email?: string;
  password?: string;
  error?: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  details: ImportResultDetail[];
}

// ─── Parse Uploaded File ─────────────────────────────────────────────────────

export async function parseImportFile(formData: FormData): Promise<{ data: ParsedStudent[] | null; error: string | null }> {
  const file = formData.get('file') as File;
  if (!file) return { data: null, error: 'No file provided.' };

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'svg'].includes(ext || '')) {
    return { data: null, error: 'Invalid file type. Only PDF and SVG files are supported.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { data: null, error: 'File too large. Maximum size is 10 MB.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (ext === 'pdf') {
      const pdfParse = ((await import('pdf-parse')) as any).default || await import('pdf-parse');
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (ext === 'svg') {
      text = extractSVGText(buffer.toString('utf-8'));
    }

    if (!text.trim()) {
      return { data: null, error: 'No readable text found in the file. Please ensure the file contains student data.' };
    }

    const students = parseTextToStudents(text);

    if (students.length === 0) {
      return { data: null, error: 'Could not detect any student records. Ensure the file has a header row with columns like Name, Roll No, Class.' };
    }

    return { data: students, error: null };
  } catch (err: any) {
    console.error('Import file parse error:', err);
    return { data: null, error: `Failed to parse file: ${err.message}` };
  }
}

// ─── Execute Student Import ──────────────────────────────────────────────────

export async function executeStudentImport(
  students: ParsedStudent[],
  schoolId: string
): Promise<ImportResult> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, successful: 0, failed: 0, duplicates: 0, details: [] };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { total: 0, successful: 0, failed: students.length, duplicates: 0, details: students.map(s => ({ name: s.name, roll_number: s.roll_number, status: 'failed' as const, error: 'Unauthorized' })) };
  }

  const finalSchoolId = schoolId || caller.school_id;
  if (!finalSchoolId) {
    return { total: 0, successful: 0, failed: students.length, duplicates: 0, details: students.map(s => ({ name: s.name, roll_number: s.roll_number, status: 'failed' as const, error: 'No school selected' })) };
  }

  // Get school info for email generation
  const { data: school } = await adminClient.from('schools').select('name, code').eq('id', finalSchoolId).single();
  const schoolSlug = (school?.code || school?.name || 'school').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Get or create classes
  const classMap = await getOrCreateClasses(adminClient, finalSchoolId, students);

  // Check for existing roll numbers to detect duplicates
  const rollNumbers = students.map(s => s.roll_number).filter(Boolean);
  const { data: existingStudents } = await adminClient
    .from('student_profiles')
    .select('roll_number')
    .eq('school_id', finalSchoolId)
    .in('roll_number', rollNumbers.length > 0 ? rollNumbers : ['__none__']);
  const existingRolls = new Set((existingStudents || []).map(s => s.roll_number));

  const result: ImportResult = { total: students.length, successful: 0, failed: 0, duplicates: 0, details: [] };

  // Process each student
  for (const student of students) {
    if (student.status === 'error' && student.errors.length > 0) {
      result.failed++;
      result.details.push({ name: student.name, roll_number: student.roll_number, status: 'failed', error: student.errors.join(', ') });
      continue;
    }

    if (student.roll_number && existingRolls.has(student.roll_number)) {
      result.duplicates++;
      result.details.push({ name: student.name, roll_number: student.roll_number, status: 'duplicate', error: 'Roll number already exists' });
      continue;
    }

    try {
      // Generate credentials
      const email = student.email || `${student.roll_number || student.name.replace(/\s+/g, '').toLowerCase()}@${schoolSlug}.edu`;
      const password = student.name.replace(/\s+/g, '').toLowerCase() + '@';

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: student.name, role: 'student', status: 'approved' },
      });

      if (authError) {
        // If user already exists by email, skip
        if (authError.message?.includes('already been registered')) {
          result.duplicates++;
          result.details.push({ name: student.name, roll_number: student.roll_number, status: 'duplicate', error: 'Email already registered' });
        } else {
          result.failed++;
          result.details.push({ name: student.name, roll_number: student.roll_number, status: 'failed', error: authError.message });
        }
        continue;
      }

      if (!authData.user) {
        result.failed++;
        result.details.push({ name: student.name, roll_number: student.roll_number, status: 'failed', error: 'Auth user creation returned null' });
        continue;
      }

      const userId = authData.user.id;
      const classId = classMap.get(normalizeClassName(student.class_name)) || null;

      // Create profile
      await adminClient.from('profiles').insert({
        id: userId,
        email,
        full_name: student.name,
        phone: student.mobile || null,
        role: 'student',
        status: 'approved',
        school_id: finalSchoolId,
        plain_password: password,
      });

      // Create student_profile
      await adminClient.from('student_profiles').insert({
        user_id: userId,
        school_id: finalSchoolId,
        class_id: classId,
        roll_number: student.roll_number || null,
        fee_status: 'unpaid',
        parent_name: student.father_name || null,
        parent_phone: student.mobile || null,
        address: student.address || null,
        gender: student.gender || null,
        dob: student.dob || null,
      });

      existingRolls.add(student.roll_number); // Prevent in-batch duplicates
      result.successful++;
      result.details.push({ name: student.name, roll_number: student.roll_number, status: 'success', email, password });
    } catch (err: any) {
      result.failed++;
      result.details.push({ name: student.name, roll_number: student.roll_number, status: 'failed', error: err.message });
    }
  }

  revalidatePath('/admin/students');
  revalidatePath('/admin/fees');

  // Log the import
  try {
    await adminClient.from('import_logs').insert({
      file_name: 'Bulk Import', // We don't have the original filename here easily, but we can pass it if needed
      imported_by: user.id,
      school_id: finalSchoolId,
      total_records: result.total,
      successful_imports: result.successful,
      failed_imports: result.failed,
      duplicate_records: result.duplicates,
      details: result.details
    });
  } catch (logError) {
    console.error('Failed to log import:', logError);
  }

  return result;
}

// ─── Helper: Extract text from SVG ───────────────────────────────────────────

function extractSVGText(svg: string): string {
  const lines: string[] = [];

  // Extract <text> elements, handling nested <tspan>
  const textBlockRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
  let blockMatch;
  while ((blockMatch = textBlockRegex.exec(svg)) !== null) {
    let inner = blockMatch[1];
    // Collect tspan contents
    const tspanRegex = /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi;
    const parts: string[] = [];
    let tm;
    while ((tm = tspanRegex.exec(inner)) !== null) {
      const t = tm[1].replace(/<[^>]*>/g, '').trim();
      if (t) parts.push(t);
    }
    if (parts.length > 0) {
      lines.push(parts.join('\t'));
    } else {
      const plain = inner.replace(/<[^>]*>/g, '').trim();
      if (plain) lines.push(plain);
    }
  }

  return lines.join('\n');
}

// ─── Helper: Parse raw text into student records ─────────────────────────────

function parseTextToStudents(text: string): ParsedStudent[] {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Remove pure separator lines
  const lines = rawLines.filter(l => !/^[-=|+\s]+$/.test(l));
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines);
  const rows = lines.map(l => splitRow(l, delimiter));

  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) return [];

  const headers = rows[headerIdx].map(h => h.toLowerCase().trim());
  const colMap = mapColumns(headers);

  if (colMap.name === -1) return []; // Must at least have a name column

  const students: ParsedStudent[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const name = col(row, colMap.name);
    if (!name || name.length < 2) continue;

    let className = col(row, colMap.class_name);
    let section = col(row, colMap.section) || 'A';

    // Smart class detection: "5-A", "Class 5 A", "5/A"
    if (className) {
      const cm = className.match(/(?:class\s*)?(\d+)\s*[-\/\s]\s*([A-Za-z])/i);
      if (cm) {
        className = `Class ${cm[1]}`;
        section = cm[2].toUpperCase();
      } else if (/^\d+$/.test(className.trim())) {
        className = `Class ${className.trim()}`;
      }
    }

    const errors: string[] = [];
    if (!name) errors.push('Name is required');
    if (!col(row, colMap.roll)) errors.push('Roll number is required');
    if (!className) errors.push('Class is required');

    students.push({
      id: crypto.randomUUID(),
      name,
      roll_number: col(row, colMap.roll),
      class_name: className || '',
      section,
      father_name: col(row, colMap.father),
      mobile: col(row, colMap.mobile),
      email: col(row, colMap.email),
      gender: col(row, colMap.gender),
      dob: col(row, colMap.dob),
      address: col(row, colMap.address),
      status: errors.length > 0 ? 'error' : 'valid',
      errors,
    });
  }

  return students;
}

function col(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? row[idx].trim() : '';
}

// ─── Helper: Detect delimiter ────────────────────────────────────────────────

function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, Math.min(5, lines.length));
  const counts: Record<string, number[]> = { '|': [], '\t': [], ',': [] };

  for (const line of sample) {
    for (const d of Object.keys(counts)) {
      counts[d].push((line.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || []).length);
    }
  }

  // Pick delimiter with most consistent non-zero count
  let best = '  '; // fallback: multiple spaces
  let bestScore = 0;
  for (const [d, arr] of Object.entries(counts)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const consistent = arr.every(c => Math.abs(c - avg) <= 1);
    if (avg > bestScore && consistent && avg >= 1) {
      bestScore = avg;
      best = d;
    }
  }
  return best;
}

function splitRow(line: string, delimiter: string): string[] {
  if (delimiter === '  ') {
    // Split by 2+ spaces
    return line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
  }
  return line.split(delimiter).map(s => s.trim()).filter((s, i, arr) => {
    // For pipe-delimited, the first/last empty cells from leading/trailing pipes
    if (delimiter === '|' && (i === 0 || i === arr.length - 1) && !s) return false;
    return true;
  });
}

// ─── Helper: Find header row ─────────────────────────────────────────────────

function findHeaderRow(rows: string[][]): number {
  const keywords = ['name', 'student', 'roll', 'class', 'section', 'father', 'mobile', 'phone', 'email', 'gender'];
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const joined = rows[i].join(' ').toLowerCase();
    const matches = keywords.filter(k => joined.includes(k)).length;
    if (matches >= 2) return i;
  }
  return -1;
}

// ─── Helper: Map column indices ──────────────────────────────────────────────

function mapColumns(headers: string[]) {
  const find = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));
  return {
    name: find(['student name', 'name', 'student']),
    roll: find(['roll', 'roll no', 'roll number', 'rollno']),
    class_name: find(['class', 'grade']),
    section: find(['section', 'sec']),
    father: find(['father', 'parent', 'guardian']),
    mobile: find(['mobile', 'phone', 'contact', 'cell']),
    email: find(['email', 'e-mail']),
    gender: find(['gender', 'sex']),
    dob: find(['dob', 'date of birth', 'birth', 'birthday']),
    address: find(['address', 'addr', 'residence']),
  };
}

// ─── Helper: Normalize class name ────────────────────────────────────────────

function normalizeClassName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ─── Helper: Get or create classes ───────────────────────────────────────────

async function getOrCreateClasses(
  adminClient: ReturnType<typeof createAdminClient>,
  schoolId: string,
  students: ParsedStudent[]
): Promise<Map<string, string>> {
  const classMap = new Map<string, string>();
  const neededClasses = new Set(students.map(s => normalizeClassName(s.class_name)).filter(Boolean));

  // Fetch existing classes
  const { data: existing } = await adminClient
    .from('classes')
    .select('id, name, section')
    .eq('school_id', schoolId);

  for (const cls of existing || []) {
    classMap.set(normalizeClassName(cls.name), cls.id);
  }

  // Create missing classes
  for (const needed of neededClasses) {
    if (!classMap.has(needed)) {
      const displayName = needed.replace(/\b\w/g, c => c.toUpperCase()); // Title case
      const { data: newClass } = await adminClient
        .from('classes')
        .insert({ name: displayName, section: 'A', school_id: schoolId })
        .select('id')
        .single();
      if (newClass) classMap.set(needed, newClass.id);
    }
  }

  return classMap;
}
