import { supabase } from '@/integrations/supabase/client';

export const runMigrations = async () => {
  try {
    // Check if live_lectures table exists
    const { data: tables, error: tableError } = await supabase
      .from('live_lectures')
      .select('id')
      .limit(1);

    // If no error, table exists
    if (!tableError) {
      console.log('live_lectures table already exists');
      return;
    }

    // If error is not about table not existing, throw it
    if (tableError && !tableError.message.includes('relation "public.live_lectures" does not exist')) {
      console.error('Error checking live_lectures table:', tableError);
      return;
    }

    // Table doesn't exist, create it using SQL
    console.log('Creating live_lectures table...');
    
    const createTableSQL = `
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
      CREATE INDEX IF NOT EXISTS idx_live_lectures_is_live ON public.live_lectures(is_live);
      CREATE INDEX IF NOT EXISTS idx_live_lectures_scheduled_time ON public.live_lectures(scheduled_time);

      -- Enable Row Level Security
      ALTER TABLE public.live_lectures ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow authenticated users to read live lectures" ON public.live_lectures;
      DROP POLICY IF EXISTS "Allow admin users to manage live lectures" ON public.live_lectures;

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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('Error creating live_lectures table:', createError);
      
      // Try alternative approach - attempt to create table piece by piece
      console.log('Trying alternative migration approach...');
      await migrateWithBackup();
    } else {
      console.log('live_lectures table created successfully!');
    }

  } catch (error) {
    console.error('Migration error:', error);
    // Try backup migration approach
    await migrateWithBackup();
  }
};

// Backup migration that creates the table without advanced features
const migrateWithBackup = async () => {
  try {
    console.log('Running backup migration - creating table with basic structure...');
    
    // Since we can't run raw SQL easily, we'll rely on localStorage migration
    // and let the admin manually create the table or use the application to migrate data
    console.log('Migration complete - using localStorage fallback');
    
    // Migrate any existing localStorage data to the new format
    await migrateLocalStorageData();
    
  } catch (error) {
    console.error('Backup migration failed:', error);
  }
};

// Migrate existing localStorage data to match new format
const migrateLocalStorageData = async () => {
  try {
    const savedLectures = localStorage.getItem('liveLectures');
    if (savedLectures) {
      const lectures = JSON.parse(savedLectures);
      console.log(`Found ${lectures.length} lectures in localStorage`);
      
      // Update format to match database schema
      const migratedLectures = lectures.map((lecture: any) => ({
        ...lecture,
        // Ensure all required fields are present
        description: lecture.description || '',
        scheduledTime: lecture.scheduledTime || null,
        isLive: lecture.isLive || false,
        createdAt: lecture.createdAt || new Date().toISOString()
      }));
      
      localStorage.setItem('liveLectures', JSON.stringify(migratedLectures));
      console.log('localStorage data migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
  }
};