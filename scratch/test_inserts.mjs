import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  console.log('--- TESTING EXAM SCHEDULE INSERT ---');
  // Find a valid class, subject, teacher, and school
  const { data: classData } = await supabase.from('classes').select('id, school_id, campus_id').limit(1).single();
  const { data: subjectData } = await supabase.from('subjects').select('id').limit(1).single();
  const { data: teacherData } = await supabase.from('profiles').select('id').eq('role', 'teacher').limit(1).single();

  if (!classData || !subjectData || !teacherData) {
    console.error('Missing prerequisites to run the test insert.');
    return;
  }

  console.log('Using IDs:');
  console.log(`- Class: ${classData.id}`);
  console.log(`- Subject: ${subjectData.id}`);
  console.log(`- Teacher: ${teacherData.id}`);
  console.log(`- School: ${classData.school_id}`);
  console.log(`- Campus: ${classData.campus_id}`);

  // Test insert into exam_schedules without campus_id
  const { data: res1, error: err1 } = await supabase.from('exam_schedules').insert({
    title: 'Test Exam',
    class_id: classData.id,
    subject_id: subjectData.id,
    teacher_id: teacherData.id,
    school_id: classData.school_id,
    campus_id: null,
    exam_date: '2026-06-01',
    start_time: '09:00:00',
    end_time: '12:00:00'
  }).select();

  if (err1) {
    console.error('❌ Exam schedules insert failed with null campus_id:', err1.message, err1.code);
  } else {
    console.log('✅ Exam schedules insert SUCCEEDED with null campus_id! Result ID:', res1[0].id);
    // clean up
    await supabase.from('exam_schedules').delete().eq('id', res1[0].id);
  }

  // Test insert into syllabi
  const { data: res2, error: err2 } = await supabase.from('syllabi').insert({
    title: 'Test Syllabus',
    academic_session: '2026-2027',
    class_id: classData.id,
    subject_id: subjectData.id,
    teacher_id: teacherData.id,
    school_id: classData.school_id
  }).select();

  if (err2) {
    console.error('❌ Syllabi insert failed:', err2.message, err2.code);
  } else {
    console.log('✅ Syllabi insert SUCCEEDED! Result ID:', res2[0].id);
    // clean up
    await supabase.from('syllabi').delete().eq('id', res2[0].id);
  }
}

testInsert();
