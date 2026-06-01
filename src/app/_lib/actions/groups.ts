'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { getFullProfile } from './profile';

export async function getCustomGroups(schoolId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('custom_student_groups')
      .select('*')
      .eq('school_id', schoolId)
      .order('group_name', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching custom groups:', error);
    return { success: false, error: 'Failed to fetch custom groups', data: [] };
  }
}

export async function createCustomGroup(
  schoolId: string,
  groupName: string,
  description?: string
) {
  const supabase = await createClient();
  const { data: profile } = await getFullProfile();
  
  // Verify user is admin
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { success: false, error: 'Only admins can create custom groups' };
  }

  // Verify admin belongs to this school
  if (profile?.role === 'admin' && profile?.admin?.school_id !== schoolId) {
    return { success: false, error: 'You can only manage groups for your school' };
  }

  try {
    const { data, error } = await supabase
      .from('custom_student_groups')
      .insert([
        {
          school_id: schoolId,
          group_name: groupName.trim(),
          description: description?.trim() || null,
          created_by: profile?.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Group "${groupName}" already exists` };
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating custom group:', error);
    return { success: false, error: 'Failed to create custom group' };
  }
}

export async function deleteCustomGroup(groupId: string) {
  const supabase = await createClient();
  const { data: profile } = await getFullProfile();
  
  // Verify user is admin
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { success: false, error: 'Only admins can delete custom groups' };
  }

  try {
    const { error } = await supabase
      .from('custom_student_groups')
      .delete()
      .eq('id', groupId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting custom group:', error);
    return { success: false, error: 'Failed to delete custom group' };
  }
}

// Get all available groups (standard + custom)
export async function getAllStudentGroups(schoolId: string) {
  const standardGroups = [
    { value: 'Science', label: 'Science' },
    { value: 'Commerce', label: 'Commerce' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Other', label: 'Other' }
  ];

  const { success, data: customGroups = [] } = await getCustomGroups(schoolId);
  
  if (!success) {
    return { data: standardGroups };
  }

  const customGroupOptions = customGroups.map((g: any) => ({
    value: g.group_name,
    label: g.group_name
  }));

  return {
    data: [...standardGroups, ...customGroupOptions]
  };
}
