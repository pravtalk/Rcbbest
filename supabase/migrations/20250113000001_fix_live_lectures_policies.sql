-- Fix live lectures RLS policies to ensure all authenticated users can read live lectures
-- while only admins can manage them

-- Drop the existing admin policy that might be conflicting
DROP POLICY IF EXISTS "Allow admin users to manage live lectures" ON public.live_lectures;

-- Recreate separate policies for admin operations
-- Allow admin users to insert live lectures
CREATE POLICY "Allow admin users to insert live lectures" ON public.live_lectures
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow admin users to update live lectures
CREATE POLICY "Allow admin users to update live lectures" ON public.live_lectures
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow admin users to delete live lectures
CREATE POLICY "Allow admin users to delete live lectures" ON public.live_lectures
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );