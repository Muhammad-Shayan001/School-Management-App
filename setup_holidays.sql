CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('everyone', 'students', 'teachers')) DEFAULT 'everyone',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS is enabled
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Enable read access for all authenticated users to holidays" 
ON public.holidays FOR SELECT TO authenticated USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Enable all access for admins to holidays" 
ON public.holidays FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin') 
        AND profiles.school_id = holidays.school_id
    )
);

-- Allow service role to bypass RLS
CREATE POLICY "Enable all access for service role to holidays"
ON public.holidays FOR ALL TO service_role USING (true);
