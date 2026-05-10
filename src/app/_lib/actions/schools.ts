'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Get all schools.
 */
export async function getSchools() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('schools')
    .select('*, admin:profiles!schools_admin_id_fkey(id, full_name, email, status)')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Create a new school.
 */
export async function createSchool(formData: FormData) {
  const adminClient = createAdminClient();

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;

  if (!name) return { error: 'School name is required.' };

  const { error } = await adminClient.from('schools').insert({
    name,
    address: address || null,
    phone: phone || null,
    email: email || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/super-admin/schools');
  return { error: null };
}

/**
 * Get school count.
 */
export async function getSchoolCount() {
  const adminClient = createAdminClient();
  const { count } = await adminClient.from('schools').select('*', { count: 'exact', head: true });
  return count || 0;
}

/**
 * Get basic school info for public signup page.
 */
export async function getPublicSchools() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('schools')
    .select('id, name')
    .order('name');
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Get basic class info for public signup page by school.
 */
export async function getPublicClasses(schoolId: string) {
  const adminClient = createAdminClient();
  
  // Fetch existing classes
  const { data: existingClasses, error } = await adminClient
    .from('classes')
    .select('id, name, section')
    .eq('school_id', schoolId)
    .order('name');

  if (error) return { data: null, error: error.message };

  // Ensure Class 1-10 exist
  const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = CLASS_NAMES.filter(name => !existingNames.has(name));

  if (missingNames.length > 0) {
    const newClasses = missingNames.map(name => ({
      name,
      school_id: schoolId,
      section: 'A'
    }));
    await adminClient.from('classes').insert(newClasses);
    
    // Fetch again after seeding
    const { data: updatedClasses } = await adminClient
      .from('classes')
      .select('id, name, section')
      .eq('school_id', schoolId)
      .order('name');
    return { data: updatedClasses, error: null };
  }

  return { data: existingClasses, error: null };
}

/**
 * Get all classes for the current user's school.
 */
export async function getClasses() {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: [], error: 'No school found' };

  const { data, error } = await adminClient
    .from('classes')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name');

  if (error) return { data: [], error: error.message };

  // Natural sort for classes (Class 1, Class 2... Class 10)
  const sortedData = (data || []).sort((a: any, b: any) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return (a.section || '').localeCompare(b.section || '');
  });

  return { data: sortedData };
}
