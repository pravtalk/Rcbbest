-- FIX: Live Lectures Only Showing in Admin App - Not for All Users
-- 
-- ISSUE: The original RLS policy used "FOR ALL" which was conflicting with the read permissions
-- SOLUTION: Split the admin policy into separate INSERT, UPDATE, DELETE policies
-- 
-- Run this SQL script in your Supabase SQL Editor to fix the issue immediately

-- Drop the existing admin policy that might be conflicting with read access
DROP POLICY IF EXISTS "Allow admin users to manage live lectures" ON public.live_lectures;

-- Recreate separate policies for admin operations
-- This ensures the read policy (FOR SELECT) works independently

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

-- Verify the policies are correctly set
-- The following should show:
-- 1. "Allow authenticated users to read live lectures" (FOR SELECT)
-- 2. "Allow admin users to insert live lectures" (FOR INSERT)  
-- 3. "Allow admin users to update live lectures" (FOR UPDATE)
-- 4. "Allow admin users to delete live lectures" (FOR DELETE)

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'live_lectures' 
ORDER BY cmd;