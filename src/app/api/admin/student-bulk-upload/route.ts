/**
 * API Route: Student Records Upload & Processing
 * Location: src/app/api/admin/student-bulk-upload/route.ts
 * 
 * This endpoint handles:
 * 1. Receiving PDF/SVG file upload
 * 2. Parsing student data from file
 * 3. Creating student accounts automatically
 * 4. Returning success/failure report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Dynamically import pdfParse to avoid ESM issues
let pdfParse: any = null;

// Types
interface StudentRecord {
  name: string;
  rollNo: string;
  class: string;
  section: string;
  fatherName: string;
  mobile: string;
  email: string;
  password: string;
}

interface UploadResult {
  success: boolean;
  totalStudents: number;
  successful: number;
  failed: number;
  details: Array<{
    email: string;
    name: string;
    success: boolean;
    error?: string;
  }>;
}

// Initialize Supabase client
async function getSupabaseClient(request: NextRequest) {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// Parse SVG file - extract all text including tspan elements
async function parseSVG(buffer: Buffer): Promise<string> {
  const content = buffer.toString('utf-8');
  const allText: string[] = [];
  
  // Extract text from <text> elements and <tspan> elements
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  
  while ((match = textRegex.exec(content)) !== null) {
    const textContent = match[1];
    
    // Extract tspan content
    const tspanRegex = /<tspan[^>]*>([^<]*)<\/tspan>/g;
    let tspanMatch;
    const tspans: string[] = [];
    
    while ((tspanMatch = tspanRegex.exec(textContent)) !== null) {
      const text = tspanMatch[1].trim();
      if (text) tspans.push(text);
    }
    
    // If no tspans, extract direct text content
    if (tspans.length === 0) {
      const directText = textContent.replace(/<[^>]*>/g, '').trim();
      if (directText) allText.push(directText);
    } else {
      allText.push(...tspans);
    }
  }
  
  return allText.join('\n');
}

// Parse PDF file with improved text extraction
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Lazy load pdf-parse to avoid build issues
    if (!pdfParse) {
      const pdfParseModule: any = await import('pdf-parse');
      pdfParse = pdfParseModule.default || pdfParseModule;
    }
    
    const data = await pdfParse(buffer);
    
    // Clean up extracted text
    let text = data.text || '';
    
    // Preserve line breaks and normalize whitespace
    text = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n');
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Fallback: return empty string if PDF parsing fails
    // SVG is the recommended format anyway
    return '';
  }
}

// Extract student records from text with robust header detection
function parseStudentRecords(text: string): StudentRecord[] {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('Found 0 text nodes. File appears to be empty or unreadable.');
  }

  // Define flexible header patterns
  const headerPatterns = {
    name: /^(name|student name|student's name)$/i,
    rollNo: /^(roll\s?no(?:\.)?|roll\s?number|registration\s?no(?:\.)?|reg\s?no(?:\.)?|reg\.?no|student\s?id)$/i,
    class: /^(class|grade|standard|level)$/i,
    section: /^(section|div|division|stream)$/i,
    fatherName: /^(father\s?name|father's\s?name|parent\s?name|guardian\s?name)$/i,
    mobile: /^(mobile|phone|contact|mobile\s?no(?:\.)?|phone\s?no(?:\.)?|contact\s?number)$/i,
    email: /^(email|email\s?address|e-?mail)$/i,
    password: /^(password|login\s?password|pwd|pass)$/i,
  };

  // Find header row positions
  const headerPositions: Record<string, number> = {};
  let headerRowIndex = -1;

  // Look for headers in first 20 lines
  const maxHeaderSearchLines = Math.min(20, lines.length);
  
  for (let i = 0; i < maxHeaderSearchLines; i++) {
    for (const [headerKey, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(lines[i])) {
        if (!headerPositions[headerKey]) {
          headerPositions[headerKey] = i;
          if (headerRowIndex === -1 || i < headerRowIndex) {
            headerRowIndex = i;
          }
        }
      }
    }
  }

  const foundHeaders = Object.keys(headerPositions).length;
  const requiredHeaders = ['name', 'rollNo', 'class', 'section', 'email', 'password'];
  const missingHeaders = requiredHeaders.filter(h => headerPositions[h] === undefined);

  if (foundHeaders === 0) {
    const preview = lines.slice(0, 5).join(' | ');
    throw new Error(
      `No headers detected. Found ${lines.length} text nodes but no valid headers (Name, Roll No, Class, Section, Email, Password). ` +
      `First items: "${preview}"`
    );
  }

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(', ')}. ` +
      `Found: ${Object.keys(headerPositions).join(', ')}`
    );
  }

  // Determine data row start (after all headers)
  const dataStartIndex = Math.max(...Object.values(headerPositions)) + 1;

  if (dataStartIndex >= lines.length) {
    throw new Error('Headers found but no data rows detected');
  }

  // Group data lines into student records
  const students: StudentRecord[] = [];
  const fieldCount = Object.keys(headerPatterns).length;
  
  // Try to detect if headers are on separate lines
  const allHeadersOnSeparateLine = 
    Object.values(headerPositions).length === fieldCount &&
    Math.max(...Object.values(headerPositions)) - Math.min(...Object.values(headerPositions)) >= fieldCount - 2;

  if (allHeadersOnSeparateLine) {
    // Headers are on separate lines - group data in chunks of fieldCount
    const dataLines = lines.slice(dataStartIndex);
    console.log(`[PARSE] Separate-line format detected. Data lines: ${dataLines.length}, Field count: ${fieldCount}`);
    
    for (let i = 0; i < dataLines.length; i += fieldCount) {
      if (i + fieldCount - 1 < dataLines.length) {
        const studentData = dataLines.slice(i, i + fieldCount);
        const field: Record<string, string> = {};
        
        // Assign data based on header order
        const headerKeys = Object.keys(headerPatterns);
        for (let j = 0; j < Math.min(studentData.length, headerKeys.length); j++) {
          field[headerKeys[j]] = studentData[j] || '';
        }

        // Validate: must have name, email, and valid email format
        const hasRequiredFields = field.name && field.name.trim().length > 0 && 
                                 field.email && field.email.trim().length > 0;
        
        if (hasRequiredFields && isValidEmail(field.email.trim())) {
          const student: StudentRecord = {
            name: field.name.trim(),
            rollNo: field.rollNo?.trim() || '',
            class: field.class?.trim() || '',
            section: field.section?.trim() || '',
            fatherName: field.fatherName?.trim() || '',
            mobile: field.mobile?.trim() || '',
            email: field.email.trim(),
            password: (field.password?.trim() || 'DefaultPass123!'),
          };
          
          students.push(student);
          console.log(`[PARSE] Added student: ${student.name} (${student.email})`);
        } else {
          console.log(`[PARSE] Skipped invalid record: name="${field.name}" email="${field.email}" valid=${isValidEmail(field.email)}`);
        }
      }
    }
  } else {
    // Single-line or delimited format
    console.log(`[PARSE] Single-line/delimited format detected`);
    const dataLines = lines.slice(dataStartIndex);
    
    for (const line of dataLines) {
      const fields = parseLineIntoFields(line);
      
      if (fields.length >= 5) {
        const student: StudentRecord = {
          name: (fields[0] || '').trim(),
          rollNo: (fields[1] || '').trim(),
          class: (fields[2] || '').trim(),
          section: (fields[3] || '').trim(),
          fatherName: (fields[4] || '').trim(),
          mobile: (fields[5] || '').trim(),
          email: (fields[6] || '').trim(),
          password: (fields[7] || 'DefaultPass123!').trim(),
        };

        // Validate: name and valid email required
        if (student.name.length > 0 && isValidEmail(student.email)) {
          students.push(student);
          console.log(`[PARSE] Added student: ${student.name} (${student.email})`);
        } else {
          console.log(`[PARSE] Skipped invalid record: name="${student.name}" email="${student.email}" valid=${isValidEmail(student.email)}`);
        }
      }
    }
  }

  if (students.length === 0) {
    console.log(`[PARSE ERROR] No valid students found`);
    console.log(`  - Total lines: ${lines.length}`);
    console.log(`  - Data lines: ${lines.length - dataStartIndex}`);
    console.log(`  - Headers found: ${Object.keys(headerPositions).join(', ')}`);
    console.log(`  - Sample data lines: ${lines.slice(dataStartIndex, Math.min(dataStartIndex + 5, lines.length)).join(' | ')}`);
    
    throw new Error(
      `Could not detect any student records. Found headers (${Object.keys(headerPositions).join(', ')}) ` +
      `and ${lines.length - dataStartIndex} data lines. ` +
      `Ensure: 1) All students have Name and Email; 2) Email addresses are valid (firstname@domain.com); 3) All required columns are present.`
    );
  }

  console.log(`[PARSE SUCCESS] Total students parsed: ${students.length}`);
  return students;
}

// Parse line into fields
function parseLineIntoFields(line: string): string[] {
  // Try pipe-separated
  if (line.includes('|')) {
    return line.split('|').map(f => f.trim());
  }

  // Try comma-separated
  if (line.includes(',')) {
    return line.split(',').map(f => f.trim());
  }

  // Try tab-separated
  if (line.includes('\t')) {
    return line.split('\t').map(f => f.trim());
  }

  // Try multiple spaces
  return line.split(/\s{2,}/).map(f => f.trim());
}

// Validate email
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Create student account
async function createStudentAccount(
  supabase: any,
  student: StudentRecord,
  schoolId: string
) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser(
      {
        email: student.email,
        password: student.password,
        email_confirm: true,
        user_metadata: {
          name: student.name,
          type: 'student',
        },
      }
    );

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create student record in database
    const { error: dbError } = await supabase.from('students').insert({
      id: uuidv4(),
      user_id: userId,
      school_id: schoolId,
      name: student.name,
      email: student.email,
      roll_number: student.rollNo,
      class: student.class,
      section: student.section,
      father_name: student.fatherName,
      mobile: student.mobile,
      admission_date: new Date().toISOString(),
      status: 'active',
    });

    if (dbError) throw dbError;

    return {
      success: true,
      email: student.email,
      name: student.name,
    };
  } catch (error: any) {
    return {
      success: false,
      email: student.email,
      name: student.name,
      error: error.message || 'Failed to create account',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API START] Student bulk upload request received');
    
    // Verify admin authentication
    const supabase = await getSupabaseClient(request);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[AUTH ERROR] User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[AUTH OK] User: ${user.id}`);

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      console.log('[AUTH ERROR] User is not an admin');
      return NextResponse.json(
        { error: 'Only admins can bulk upload student records' },
        { status: 403 }
      );
    }

    console.log('[ADMIN OK] User is admin');

    // Get admin's school_id
    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();

    if (!profileData?.school_id) {
      console.log('[SCHOOL ERROR] School information not found');
      return NextResponse.json(
        { error: 'School information not found' },
        { status: 400 }
      );
    }

    console.log(`[SCHOOL OK] School: ${profileData.school_id}`);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('[FILE ERROR] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[FILE OK] File: ${file.name} (${file.size} bytes, type: ${file.type})`);

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isSVG = fileName.endsWith('.svg');

    if (!isPDF && !isSVG) {
      console.log(`[FILE TYPE ERROR] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Only PDF and SVG files are supported' },
        { status: 400 }
      );
    }

    console.log(`[FILE TYPE OK] Format: ${isPDF ? 'PDF' : 'SVG'}`);

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[BUFFER OK] Buffer size: ${buffer.length} bytes`);

    // Parse file based on type
    let textContent: string;
    try {
      if (isPDF) {
        console.log('[PARSING] Starting PDF parse...');
        textContent = await parsePDF(buffer);
      } else {
        console.log('[PARSING] Starting SVG parse...');
        textContent = await parseSVG(buffer);
      }
      console.log(`[PARSING OK] Extracted ${textContent.length} characters`);
    } catch (parseFileError: any) {
      console.error('[PARSING FILE ERROR]', parseFileError.message);
      return NextResponse.json(
        {
          error: `Failed to parse ${isPDF ? 'PDF' : 'SVG'} file: ${parseFileError.message}`,
          success: false,
          totalStudents: 0,
          successful: 0,
          failed: 0,
          details: [],
        },
        { status: 400 }
      );
    }

    // Log extracted content for debugging
    const extractedLines = textContent.split('\n').filter(l => l.trim());
    console.log(`[TEXT EXTRACTION] Total lines: ${extractedLines.length}`);
    console.log(`[TEXT SAMPLE] First 10 lines:`, extractedLines.slice(0, 10));

    // Check if any text was extracted
    if (!textContent || textContent.trim().length === 0) {
      console.error('[ERROR] No text content extracted');
      return NextResponse.json(
        {
          error: 'No readable text found in the file. Please ensure the file contains student data.',
          diagnostics: {
            fileType: isPDF ? 'PDF' : 'SVG',
            fileName,
            textExtracted: false,
            textLength: 0,
            suggestion: 'Ensure file contains text data (not image-based PDF)',
          },
          success: false,
          totalStudents: 0,
          successful: 0,
          failed: 0,
          details: [],
        },
        { status: 400 }
      );
    }

    // Extract student records
    let students: StudentRecord[] = [];
    try {
      console.log('[STUDENT PARSING] Starting student record parsing...');
      students = parseStudentRecords(textContent);
      console.log(`[STUDENT PARSING OK] Successfully parsed ${students.length} students`);
    } catch (parseError: any) {
      console.error('[STUDENT PARSING ERROR]', parseError.message);
      return NextResponse.json(
        {
          error: parseError.message || 'Failed to parse student records',
          diagnostics: {
            fileType: isPDF ? 'PDF' : 'SVG',
            fileName,
            textExtracted: true,
            textLength: textContent.length,
            linesFound: extractedLines.length,
            firstLines: extractedLines.slice(0, 5),
            suggestion: parseError.message.includes('No headers')
              ? 'Ensure headers are present: Name, Roll No, Class, Section, Email, Password'
              : parseError.message.includes('Could not detect')
              ? 'Check: 1) All students have Name and Email; 2) Emails are valid format; 3) No extra blank lines'
              : 'Review file structure and format',
            errorDetails: parseError.message,
          },
          success: false,
          totalStudents: 0,
          successful: 0,
          failed: 0,
          details: [],
        },
        { status: 400 }
      );
    }

    // Create accounts for each student
    console.log(`[ACCOUNT CREATION] Starting account creation for ${students.length} students...`);
    
    const results = await Promise.all(
      students.map((student, index) => {
        console.log(`[ACCOUNT CREATION] Creating account ${index + 1}/${students.length}: ${student.name} (${student.email})`);
        return createStudentAccount(supabase, student, profileData.school_id);
      })
    );

    // Prepare response
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[RESULTS] Total: ${students.length}, Successful: ${successful}, Failed: ${failed}`);

    const response: UploadResult = {
      success: failed === 0,
      totalStudents: students.length,
      successful,
      failed,
      details: results,
    };

    console.log('[API SUCCESS] Upload completed successfully');
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Upload processing error:', error);

    // Provide detailed error diagnostics
    const errorMessage = error.message || 'Failed to process file';
    
    return NextResponse.json(
      {
        error: errorMessage,
        diagnostics: {
          errorType: error.name || 'Unknown Error',
          errorDetails: errorMessage,
          suggestion: errorMessage.includes('No headers detected') 
            ? 'Ensure your file contains a header row with: Name, Roll No, Class, Section, Email, Password'
            : errorMessage.includes('No readable text')
            ? 'Try converting your PDF to SVG or re-exporting your document'
            : 'Check file format and content structure',
        },
        success: false,
        totalStudents: 0,
        successful: 0,
        failed: 0,
        details: [],
      },
      { status: 400 }
    );
  }
}
