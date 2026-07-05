import { NextResponse } from 'next/server';
import { createClient } from '@/app/_lib/supabase/server';

/**
 * GET: Fetch current user's school details including institution_type.
 * Used by InstitutionContext to determine dynamic terminology.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile to find their school_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      // Super admin may not have a school_id
      return NextResponse.json({ institution_type: 'school' });
    }

    // Fetch the school details including institution_type
    const { data: school } = await supabase
      .from('schools')
      .select('id, name, institution_type, settings')
      .eq('id', profile.school_id)
      .single();

    if (!school) {
      return NextResponse.json({ institution_type: 'school' });
    }

    return NextResponse.json({
      id: school.id,
      name: school.name,
      institution_type: school.institution_type || 'school',
      settings: school.settings,
    });
  } catch (error) {
    console.error('Error fetching current school:', error);
    return NextResponse.json({ institution_type: 'school' });
  }
}
