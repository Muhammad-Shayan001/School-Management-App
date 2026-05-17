import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStudentProfile() {
  console.log('Checking current students and their IDs...');
  
  const { data: students, error } = await supabase
    .from('student_profiles')
    .select('id, user_id, roll_number, profiles(full_name, email)')
    .limit(10);

  if (error) {
    console.error('Error fetching students:', error);
  } else {
    console.table(students.map(s => ({
      name: s.profiles.full_name,
      email: s.profiles.email,
      user_id: s.user_id,
      roll_number: s.roll_number || 'MISSING'
    })));
  }
}

checkStudentProfile();
