import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('teacher_assignments').select('*').limit(5);
  if (error) {
    console.error('❌ teacher_assignments Error:', error.message);
  } else {
    console.log('✅ teacher_assignments Exists! Number of rows fetched:', data.length);
    if (data.length > 0) {
      console.log('Sample rows:', data);
    }
  }
}

check();
