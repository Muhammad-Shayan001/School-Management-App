import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const tables = [
    'syllabi',
    'syllabus_chapters',
    'exam_schedules',
    'exam_timetable',
    'student_profiles',
    'teacher_profiles',
    'schools',
    'classes',
    'subjects'
  ];

  console.log('--- SUPABASE TABLE CHECK ---');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${table}': ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table '${table}': EXISTS (fetched ${data.length} rows)`);
      if (data.length > 0) {
        console.log(`  Sample columns:`, Object.keys(data[0]));
      }
    }
  }
}

check();
