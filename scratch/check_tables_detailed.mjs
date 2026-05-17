import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('--- DATABASE DIAGNOSTICS ---');

    // 1. Check if tables exist
    const tablesToCheck = [
      'profiles', 'student_profiles', 'teacher_profiles', 'schools', 
      'classes', 'subjects', 'syllabi', 'syllabus_chapters', 
      'exam_schedules', 'exam_timetable', 'attendance', 'results'
    ];

    for (const table of tablesToCheck) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      const exists = res.rows[0].exists;
      console.log(`Table '${table}': ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // 2. Check student_profiles columns and constraints
    console.log('\n--- student_profiles SCHEMA ---');
    const studentCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'student_profiles';
    `);
    studentCols.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Check student_profiles unique constraints
    console.log('\n--- student_profiles UNIQUE CONSTRAINTS ---');
    const studentConstraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'public.student_profiles'::regclass;
    `);
    studentConstraints.rows.forEach(c => {
      console.log(`- ${c.conname}: ${c.pg_get_constraintdef}`);
    });

    // 4. Check teacher_profiles unique constraints
    console.log('\n--- teacher_profiles UNIQUE CONSTRAINTS ---');
    const teacherConstraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'public.teacher_profiles'::regclass;
    `);
    teacherConstraints.rows.forEach(c => {
      console.log(`- ${c.conname}: ${c.pg_get_constraintdef}`);
    });

  } catch (err) {
    console.error('Error during diagnostics:', err);
  } finally {
    await client.end();
  }
}

run();
