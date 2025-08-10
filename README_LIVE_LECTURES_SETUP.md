# Live Lectures Setup Guide

## Database Setup

The live lectures feature requires a new table in your Supabase database. Please run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create live_lectures table
CREATE TABLE IF NOT EXISTS public.live_lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    instructor TEXT NOT NULL,
    is_live BOOLEAN DEFAULT false,
    scheduled_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_lectures_is_live ON public.live_lectures(is_live);
CREATE INDEX IF NOT EXISTS idx_live_lectures_scheduled_time ON public.live_lectures(scheduled_time);

-- Enable Row Level Security
ALTER TABLE public.live_lectures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (in case of re-running)
DROP POLICY IF EXISTS "Allow authenticated users to read live lectures" ON public.live_lectures;
DROP POLICY IF EXISTS "Allow admin users to manage live lectures" ON public.live_lectures;

-- Allow authenticated users to read live lectures
CREATE POLICY "Allow authenticated users to read live lectures" ON public.live_lectures
    FOR SELECT TO authenticated USING (true);

-- Allow admin users to manage live lectures (insert, update, delete)
CREATE POLICY "Allow admin users to manage live lectures" ON public.live_lectures
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_live_lectures_updated_at ON public.live_lectures;
CREATE TRIGGER update_live_lectures_updated_at 
    BEFORE UPDATE ON public.live_lectures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Features Fixed

### 1. ✅ Live Lectures Persistence
- **Problem**: Live lectures were stored in localStorage only and disappeared on page reload
- **Solution**: Created proper database table with Supabase integration
- **Result**: Live lectures now persist across browser sessions and page reloads

### 2. ✅ Realtime Updates
- **Problem**: Changes weren't visible to students immediately
- **Solution**: Added Supabase realtime subscriptions
- **Result**: Students see live lecture updates instantly without page refresh

### 3. ✅ Time Display Fixed
- **Problem**: Time showed calculated values instead of admin-provided time
- **Solution**: Simplified time display logic to prioritize admin-provided scheduled time
- **Result**: Students see the exact time set by admin, not computed time

### 4. ✅ Live Indicator in Footer
- **Problem**: Students couldn't easily see if there were live lectures
- **Solution**: Added red pulsing indicator on "Live" tab when lectures are active
- **Result**: Visual indicator shows when live lectures are available

## How to Use

### For Admins:
1. Go to Admin panel → Live Lectures tab
2. Add new live lecture with title, description, video URL, instructor, and scheduled time
3. Toggle "Set Live" to make it visible to students
4. Students will see it immediately in their Live Classes page

### For Students:
1. Check the footer navigation - red dot on "Live" means active lectures
2. Go to Live Classes page to see all available lectures
3. Time displayed is exactly as set by admin
4. Join live lectures or set reminders for scheduled ones

## Technical Implementation

- **Database**: PostgreSQL table with UUID primary keys
- **Realtime**: Supabase realtime subscriptions for instant updates  
- **Security**: Row Level Security policies for admin/student access
- **Fallback**: localStorage backup for backward compatibility
- **Migration**: Automatic migration of existing localStorage data

## Troubleshooting

If you encounter issues:

1. **Table doesn't exist**: Run the SQL commands above in Supabase SQL Editor
2. **Permission denied**: Ensure your user has admin role in `auth.users.raw_user_meta_data`
3. **Not updating**: Check browser console for errors and Supabase connection
4. **Time issues**: Ensure scheduled_time is in proper ISO 8601 format

The system will automatically fall back to localStorage if database connection fails, ensuring continued functionality.