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

-- Create index for better performance
CREATE INDEX idx_live_lectures_is_live ON public.live_lectures(is_live);
CREATE INDEX idx_live_lectures_scheduled_time ON public.live_lectures(scheduled_time);

-- Enable Row Level Security
ALTER TABLE public.live_lectures ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_lectures_updated_at 
    BEFORE UPDATE ON public.live_lectures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();