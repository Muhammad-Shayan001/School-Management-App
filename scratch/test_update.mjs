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

async function testUpdate() {
  const testUserId = '138c2b16-a6d6-4c1d-a076-173c8c30505d'; 
  
  console.log('Fetching current profile for user:', testUserId);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', testUserId).single();
  
  if (!profile) {
    console.error('User not found');
    return;
  }

  console.log('Current Name:', profile.full_name);
  
  const newName = 'Updated Name ' + Date.now();
  console.log('Attempting update to:', newName);

  const { error: err1 } = await supabase.from('profiles').update({ full_name: newName }).eq('id', testUserId);
  if (err1) console.error('Profiles update error:', err1);
  else console.log('Profiles table updated.');

  const { error: err2 } = await supabase.from('student_profiles').upsert({
    user_id: testUserId,
    school_id: profile.school_id,
    roll_number: 'TEST-' + Math.floor(Math.random() * 1000)
  }, { onConflict: 'user_id' });
  
  if (err2) console.error('Student profiles upsert error:', err2);
  else console.log('Student profiles table updated successfully.');
}

testUpdate();
