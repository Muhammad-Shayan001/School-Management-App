import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We need a helper to generate teacher ID
async function generateTeacherId() {
  const year = new Date().getFullYear();
  const prefix = `TCH-${year}-`;
  
  const { data } = await supabase
    .from('teacher_profiles')
    .select('teacher_id')
    .like('teacher_id', `${prefix}%`)
    .order('teacher_id', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0 && data[0].teacher_id) {
    const lastId = data[0].teacher_id;
    const lastNumber = parseInt(lastId.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

async function testCreateTeacher() {
  console.log('--- TESTING TEACHER CREATION ---');
  // Get a school to assign to
  const { data: school } = await supabase.from('schools').select('id').limit(1).single();
  if (!school) {
    console.error('No school found in the database.');
    return;
  }

  console.log(`Using School ID: ${school.id}`);

  const testEmail = `test_teacher_${Math.floor(Math.random() * 1000000)}@test.com`;
  const teacherId = await generateTeacherId();

  console.log(`Generated Teacher ID: ${teacherId}`);
  console.log(`Using Email: ${testEmail}`);

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { role: 'teacher', full_name: 'Test Teacher', school_id: school.id, status: 'approved' }
  });

  if (authError) {
    console.error('❌ Auth creation failed:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Auth user created successfully. ID: ${userId}`);

  // Step 2: Create profile record
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email: testEmail,
    full_name: 'Test Teacher',
    role: 'teacher',
    school_id: school.id,
    status: 'approved',
    phone: '03001234567'
  });

  if (profileError) {
    console.error('❌ Profile creation failed:', profileError.message);
    // clean up auth
    await supabase.auth.admin.deleteUser(userId);
    return;
  }
  console.log('✅ Profile inserted successfully.');

  // Step 3: Insert teacher_profiles
  const { error: teacherError } = await supabase.from('teacher_profiles').insert({
    user_id: userId,
    school_id: school.id,
    campus_id: null,
    teacher_id: teacherId,
    is_class_teacher: false,
    class_id: null,
    qualification: 'M.Phil',
    experience: '5 Years',
    cnic: '42101-1234567-1',
    address: 'Test Address',
    gender: 'male',
    dob: '1990-01-01',
    city: 'Karachi',
    country: 'Pakistan'
  });

  if (teacherError) {
    console.error('❌ teacher_profiles insertion failed:', teacherError.message);
    // clean up
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
  } else {
    console.log('✅ teacher_profiles inserted successfully!');
    // clean up all test data
    await supabase.from('teacher_profiles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Cleaned up test data.');
  }
}

testCreateTeacher();
