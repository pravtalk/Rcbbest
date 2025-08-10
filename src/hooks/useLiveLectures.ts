import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type LiveLectureRow = Tables<'live_lectures'>;

interface LiveLecture {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  instructor: string;
  isLive: boolean;
  scheduledTime?: string;
  createdAt: string;
}

// Convert database row to frontend interface
const convertToLecture = (row: LiveLectureRow): LiveLecture => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  videoUrl: row.video_url,
  instructor: row.instructor,
  isLive: row.is_live || false,
  scheduledTime: row.scheduled_time || undefined,
  createdAt: row.created_at,
});

// Convert frontend interface to database row for insert/update
const convertFromLecture = (lecture: LiveLecture): Omit<Tables<'live_lectures'>, 'id' | 'created_at' | 'updated_at'> => ({
  title: lecture.title,
  description: lecture.description || null,
  video_url: lecture.videoUrl,
  instructor: lecture.instructor,
  is_live: lecture.isLive,
  scheduled_time: lecture.scheduledTime || null,
});

export const useLiveLectures = () => {
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('live_lectures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading live lectures:', error);
        // Fallback to localStorage for backward compatibility
        const savedLectures = localStorage.getItem('liveLectures');
        if (savedLectures) {
          const lectures = JSON.parse(savedLectures);
          setLiveLectures(lectures);
        }
        return;
      }

      if (data) {
        const lectures = data.map(convertToLecture);
        setLiveLectures(lectures);
      }
    } catch (error) {
      console.error('Error loading live lectures:', error);
      // Fallback to localStorage
      try {
        const savedLectures = localStorage.getItem('liveLectures');
        if (savedLectures) {
          const lectures = JSON.parse(savedLectures);
          setLiveLectures(lectures);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveLectures = async (lectures: LiveLecture[]) => {
    try {
      // For backward compatibility, also save to localStorage
      localStorage.setItem('liveLectures', JSON.stringify(lectures));
      setLiveLectures(lectures);
    } catch (error) {
      console.error('Error saving live lectures:', error);
    }
  };

  const addLecture = async (lecture: Omit<LiveLecture, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('live_lectures')
        .insert([convertFromLecture({ ...lecture, id: '', createdAt: '' })])
        .select()
        .single();

      if (error) {
        console.error('Error adding lecture:', error);
        throw error;
      }

      if (data) {
        const newLecture = convertToLecture(data);
        setLiveLectures(prev => [newLecture, ...prev]);
        return newLecture;
      }
    } catch (error) {
      console.error('Error adding lecture:', error);
      throw error;
    }
  };

  const updateLecture = async (lectureId: string, updates: Partial<LiveLecture>) => {
    try {
      const updateData = convertFromLecture({ 
        id: lectureId, 
        createdAt: '', 
        ...updates 
      } as LiveLecture);

      const { data, error } = await supabase
        .from('live_lectures')
        .update(updateData)
        .eq('id', lectureId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lecture:', error);
        throw error;
      }

      if (data) {
        const updatedLecture = convertToLecture(data);
        setLiveLectures(prev => 
          prev.map(lecture => 
            lecture.id === lectureId ? updatedLecture : lecture
          )
        );
        return updatedLecture;
      }
    } catch (error) {
      console.error('Error updating lecture:', error);
      throw error;
    }
  };

  const deleteLecture = async (lectureId: string) => {
    try {
      const { error } = await supabase
        .from('live_lectures')
        .delete()
        .eq('id', lectureId);

      if (error) {
        console.error('Error deleting lecture:', error);
        throw error;
      }

      setLiveLectures(prev => prev.filter(lecture => lecture.id !== lectureId));
    } catch (error) {
      console.error('Error deleting lecture:', error);
      throw error;
    }
  };

  const refreshLectures = () => {
    loadLectures();
  };

  useEffect(() => {
    loadLectures();

    // Set up real-time subscription
    const subscription = supabase
      .channel('live_lectures_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_lectures' }, 
        () => {
          loadLectures();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    liveLectures,
    loading,
    saveLectures,
    addLecture,
    updateLecture,
    deleteLecture,
    refreshLectures
  };
};