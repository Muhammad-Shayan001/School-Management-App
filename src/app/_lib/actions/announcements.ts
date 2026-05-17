'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createAnnouncement(params: {
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  target_type: 'all' | 'teachers' | 'students' | 'class' | 'section' | 'teacher';
  target_id?: string | null;
  attachment_url?: string | null;
  expires_at?: string | null;
  campus_id?: string | null;
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Only administrators can publish announcements' };
  }

  try {
    const { error } = await adminClient
      .from('announcements')
      .insert({
        school_id: profile.school_id,
        title: params.title,
        content: params.content,
        priority: params.priority,
        target_type: params.target_type,
        target_id: params.target_id || null,
        attachment_url: params.attachment_url,
        expires_at: params.expires_at || null,
        created_by: user.id,
        campus_id: params.campus_id || null
      });

    if (error) {
      console.error('Database error in createAnnouncement:', error);
      return { error: `Database failure: ${error.message}` };
    }

    revalidatePath('/admin/announcements');
    revalidatePath('/teacher');
    revalidatePath('/student');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAnnouncement:', err);
    return { error: 'An unexpected error occurred while creating the announcement' };
  }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  
  revalidatePath('/admin/announcements');
  return { success: true };
}

export async function getRelevantAnnouncements() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, role, school_id,
      student_profiles(class_id),
      teacher_profiles(user_id)
    `)
    .eq('id', user.id)
    .single();

  if (!profile) return { data: [] };

  const today = new Date().toISOString().split('T')[0];

  // Base query: General and Role-specific announcements
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('school_id', profile.school_id)
    .or(`expires_at.is.null,expires_at.gte.${today}`);

  // For campus filtering
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    // We fetch all for admin, and let the frontend filter by selected campus
  } else if (profile.role === 'teacher') {
    const campusId = (profile.teacher_profiles as any)?.[0]?.campus_id;
    if (campusId) {
       query = query.eq('campus_id', campusId);
    }
  } else if (profile.role === 'student') {
    const campusId = (profile.student_profiles as any)?.[0]?.campus_id;
    if (campusId) {
       query = query.eq('campus_id', campusId);
    }
  }
    
  query = query.order('priority', { ascending: false }) // Urgent first
    .order('created_at', { ascending: false });

  // Filtering logic based on role
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    // Admins see everything
  } else if (profile.role === 'teacher') {
    query = query.or(`target_type.eq.all,target_type.eq.teachers,and(target_type.eq.teacher,target_id.eq.${profile.id})`);
  } else if (profile.role === 'student') {
    const classId = (profile.student_profiles as any)?.[0]?.class_id;
    if (classId) {
      query = query.or(`target_type.eq.all,target_type.eq.students,and(target_type.eq.class,target_id.eq.${classId})`);
    } else {
      query = query.or('target_type.eq.all,target_type.eq.students');
    }
  }

  const { data, error } = await query;
  return { data: data || [], error: error?.message };
}

export async function getAllAnnouncements(campusId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  let query = supabase
    .from('announcements')
    .select('*')
    .eq('school_id', profile?.school_id);
    
  if (campusId) {
    query = query.eq('campus_id', campusId);
  }

  const { data } = await query.order('created_at', { ascending: false });

  return { data: data || [] };
}
