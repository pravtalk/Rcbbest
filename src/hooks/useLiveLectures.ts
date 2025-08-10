import { useState, useEffect } from 'react';

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

export const useLiveLectures = () => {
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLectures = () => {
    try {
      const savedLectures = localStorage.getItem('liveLectures');
      if (savedLectures) {
        const lectures = JSON.parse(savedLectures);
        setLiveLectures(lectures);
      }
    } catch (error) {
      console.error('Error loading live lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLectures = (lectures: LiveLecture[]) => {
    try {
      localStorage.setItem('liveLectures', JSON.stringify(lectures));
      setLiveLectures(lectures);
    } catch (error) {
      console.error('Error saving live lectures:', error);
    }
  };

  const refreshLectures = () => {
    loadLectures();
  };

  useEffect(() => {
    loadLectures();
    
    // Listen for storage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'liveLectures') {
        loadLectures();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    liveLectures,
    loading,
    saveLectures,
    refreshLectures
  };
};