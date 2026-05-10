-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add missing columns one by one to ensure they exist
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS term TEXT DEFAULT 'Final Term';
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies
DROP POLICY IF EXISTS "Public read exams" ON public.exam_schedules;
CREATE POLICY "Public read exams" ON public.exam_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "All write exams" ON public.exam_schedules;
CREATE POLICY "All write exams" ON public.exam_schedules FOR ALL USING (true);

-- 5. Fix subjects permissions just in case
DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

-- 6. RELOAD POSTGREST CACHE (This is usually automatic but good to keep in mind)
-- You may need to restart the Supabase project or wait a minute if the error persists.
