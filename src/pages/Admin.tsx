import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Settings, GraduationCap, Video, Trash2, Plus, Play, Edit, FileText, Brain, Upload, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedBatchManagement from '@/components/EnhancedBatchManagement';
import { useLiveLectures } from '@/hooks/useLiveLectures';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}


interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

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

const Admin = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const { liveLectures, loading: lecturesLoading, addLecture, updateLecture, deleteLecture, refreshLectures } = useLiveLectures();
  const [loading, setLoading] = useState(true);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LiveLecture | null>(null);
  const [liveForm, setLiveForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    instructor: '',
    scheduledTime: ''
  });

  // Practice Zone state
  const [practiceNotes, setPracticeNotes] = useState<any[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    subject: '',
    description: '',
    file: null as File | null
  });
  const [questionForm, setQuestionForm] = useState({
    title: '',
    subject: '',
    description: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    time_limit_minutes: 30
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole && userRole !== 'admin') {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      return;
    }
    if (userRole === 'admin') {
      fetchData();
    }
  }, [user, userRole, navigate]);

  const fetchData = async () => {
    try {
      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          created_at,
          user_roles (role)
        `);

      if (usersError) throw usersError;

      // Get user emails from auth metadata (this would need to be done via an edge function in production)
      const formattedUsers = usersData?.map(user => ({
        id: user.user_id,
        email: 'user@example.com', // In production, fetch from edge function
        full_name: user.full_name || 'N/A',
        role: (user.user_roles as { role: string }[])?.[0]?.role || 'student',
        created_at: user.created_at,
      })) || [];

      setUsers(formattedUsers);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Fetch practice notes
      const { data: notesData, error: notesError } = await supabase
        .from('practice_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setPracticeNotes(notesData || []);

      // Fetch practice questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('practice_questions')
        .select(`
          *,
          question_items(count)
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      setPracticeQuestions(questionsData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove this function as it's now handled by the hook

  const validateVideoUrl = (url: string): { isValid: boolean; message?: string; type?: string } => {
    if (!url.trim()) {
      return { isValid: false, message: 'URL is required' };
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      
      // Check for supported protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, message: 'URL must use HTTP or HTTPS protocol' };
      }

      // YouTube validation
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (!videoId) {
          return { isValid: false, message: 'Invalid YouTube URL format' };
        }
        return { isValid: true, type: 'YouTube' };
      }

      // Vimeo validation
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/);
        if (!videoId) {
          return { isValid: false, message: 'Invalid Vimeo URL format' };
        }
        return { isValid: true, type: 'Vimeo' };
      }

      // HLS stream validation
      if (url.includes('.m3u8')) {
        return { isValid: true, type: 'HLS Stream' };
      }

      // Direct video file validation
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
      const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
      if (hasVideoExtension) {
        return { isValid: true, type: 'Direct Video' };
      }

      // Generic URL (could be embedded content)
      return { isValid: true, type: 'External Link' };

    } catch (error) {
      return { isValid: false, message: 'Invalid URL format' };
    }
  };

  const handleLiveFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic field validation
    if (!liveForm.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!liveForm.instructor.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Instructor name is required',
        variant: 'destructive',
      });
      return;
    }

    // URL validation
    const urlValidation = validateVideoUrl(liveForm.videoUrl);
    if (!urlValidation.isValid) {
      toast({
        title: 'Invalid Video URL',
        description: urlValidation.message || 'Please enter a valid video URL',
        variant: 'destructive',
      });
      return;
    }

    // Scheduled time validation
    if (liveForm.scheduledTime) {
      const scheduledDate = new Date(liveForm.scheduledTime);
      const now = new Date();
      if (scheduledDate < now) {
        toast({
          title: 'Invalid Schedule',
          description: 'Scheduled time cannot be in the past',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const lectureData = {
        title: liveForm.title.trim(),
        description: liveForm.description.trim(),
        videoUrl: liveForm.videoUrl.trim(),
        instructor: liveForm.instructor.trim(),
        isLive: true,
        scheduledTime: liveForm.scheduledTime || undefined,
      };

      if (editingLecture) {
        await updateLecture(editingLecture.id, lectureData);
      } else {
        await addLecture(lectureData);
      }
      
      // Reset form
      setLiveForm({
        title: '',
        description: '',
        videoUrl: '',
        instructor: '',
        scheduledTime: ''
      });
      setShowLiveForm(false);
      setEditingLecture(null);

      toast({
        title: 'Success',
        description: `Live lecture ${editingLecture ? 'updated' : 'added'} successfully! (${urlValidation.type})`,
      });

    } catch (error) {
      console.error('Error saving live lecture:', error);
      toast({
        title: 'Error',
        description: 'Failed to save live lecture. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditLecture = (lecture: LiveLecture) => {
    setEditingLecture(lecture);
    setLiveForm({
      title: lecture.title,
      description: lecture.description,
      videoUrl: lecture.videoUrl,
      instructor: lecture.instructor,
      scheduledTime: lecture.scheduledTime || ''
    });
    setShowLiveForm(true);
  };

  const handleDeleteLecture = async (lectureId: string) => {
    try {
      const lectureToDelete = liveLectures.find(lecture => lecture.id === lectureId);
      if (!lectureToDelete) {
        toast({
          title: 'Error',
          description: 'Lecture not found',
          variant: 'destructive',
        });
        return;
      }

      await deleteLecture(lectureId);
      
      toast({
        title: 'Success',
        description: `"${lectureToDelete.title}" has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting live lecture:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete live lecture',
        variant: 'destructive',
      });
    }
  };

  const toggleLectureStatus = async (lectureId: string) => {
    try {
      const lecture = liveLectures.find(l => l.id === lectureId);
      if (!lecture) {
        toast({
          title: 'Error',
          description: 'Lecture not found',
          variant: 'destructive',
        });
        return;
      }

      await updateLecture(lectureId, { isLive: !lecture.isLive });
      
      toast({
        title: 'Success',
        description: `"${lecture.title}" is now ${!lecture.isLive ? 'live' : 'offline'}`,
      });
    } catch (error) {
      console.error('Error toggling lecture status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lecture status',
        variant: 'destructive',
      });
    }
  };

  // Practice Zone Management Functions
  const handleNoteUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteForm.file || !noteForm.title.trim() || !noteForm.subject.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and select a file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingFile(true);

      // Upload file to Supabase storage
      const fileExt = noteForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('practice-notes')
        .upload(fileName, noteForm.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('practice-notes')
        .getPublicUrl(fileName);

      // Save note to database
      const { data, error } = await supabase
        .from('practice_notes')
        .insert([{
          title: noteForm.title.trim(),
          subject: noteForm.subject.trim(),
          description: noteForm.description.trim() || null,
          file_url: publicUrl,
          file_size_bytes: noteForm.file.size,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPracticeNotes(prev => [data, ...prev]);

      // Reset form
      setNoteForm({
        title: '',
        subject: '',
        description: '',
        file: null
      });
      setShowNoteForm(false);

      toast({
        title: 'Success',
        description: 'Practice note uploaded successfully!',
      });

    } catch (error) {
      console.error('Error uploading note:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload the note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('practice_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setPracticeNotes(prev => prev.filter(note => note.id !== noteId));

      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionForm.title.trim() || !questionForm.subject.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('practice_questions')
        .insert([{
          title: questionForm.title.trim(),
          subject: questionForm.subject.trim(),
          description: questionForm.description.trim() || null,
          difficulty: questionForm.difficulty,
          time_limit_minutes: questionForm.time_limit_minutes,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPracticeQuestions(prev => [{ ...data, question_items: [{ count: 0 }] }, ...prev]);

      // Reset form
      setQuestionForm({
        title: '',
        subject: '',
        description: '',
        difficulty: 'Easy',
        time_limit_minutes: 30
      });
      setShowQuestionForm(false);

      toast({
        title: 'Success',
        description: 'Quiz created successfully! You can now add questions to it.',
      });

    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create the quiz. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('practice_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setPracticeQuestions(prev => prev.filter(q => q.id !== questionId));

      toast({
        title: 'Success',
        description: 'Quiz deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quiz.',
        variant: 'destructive',
      });
    }
  };

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">Only administrators can access this panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Batches',
      value: batches.length,
      icon: GraduationCap,
      description: 'Active batches',
    },
    {
      title: 'Live Lectures',
      value: liveLectures.length,
      icon: Video,
      description: 'Available lectures',
    },
    {
      title: 'Practice Notes',
      value: practiceNotes.length,
      icon: FileText,
      description: 'Study materials',
    },
    {
      title: 'Practice Quizzes',
      value: practiceQuestions.length,
      icon: Brain,
      description: 'Quiz questions',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users and batches
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="batches" className="text-xs sm:text-sm">Batches</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="live-lectures" className="text-xs sm:text-sm">Live Lectures</TabsTrigger>
            <TabsTrigger value="practice-zone" className="text-xs sm:text-sm">Practice Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <EnhancedBatchManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage registered users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live-lectures" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Lectures Management</CardTitle>
                    <CardDescription>
                      Add and manage live lecture links for students
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setShowLiveForm(true);
                      setEditingLecture(null);
                      setLiveForm({
                        title: '',
                        description: '',
                        videoUrl: '',
                        instructor: '',
                        scheduledTime: ''
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Live Lecture
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showLiveForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingLecture ? 'Edit Live Lecture' : 'Add New Live Lecture'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLiveFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                              id="title"
                              value={liveForm.title}
                              onChange={(e) => setLiveForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter lecture title"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instructor">Instructor *</Label>
                            <Input
                              id="instructor"
                              value={liveForm.instructor}
                              onChange={(e) => setLiveForm(prev => ({ ...prev, instructor: e.target.value }))}
                              placeholder="Enter instructor name"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="videoUrl">Video URL *</Label>
                          <Input
                            id="videoUrl"
                            value={liveForm.videoUrl}
                            onChange={(e) => setLiveForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                            placeholder="Enter video/stream URL (YouTube, Vimeo, direct link, HLS stream, etc.)"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Supports YouTube, Vimeo, direct video links, HLS streams (.m3u8), and other embedded content
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={liveForm.description}
                            onChange={(e) => setLiveForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter lecture description"
                            rows={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
                          <Input
                            id="scheduledTime"
                            type="datetime-local"
                            value={liveForm.scheduledTime}
                            onChange={(e) => setLiveForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button type="submit">
                            {editingLecture ? 'Update Lecture' : 'Add Lecture'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setShowLiveForm(false);
                              setEditingLecture(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {liveLectures.length === 0 ? (
                    <div className="text-center py-8">
                      <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Live Lectures</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first live lecture to get started
                      </p>
                      <Button 
                        onClick={() => setShowLiveForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Live Lecture
                      </Button>
                    </div>
                  ) : (
                    liveLectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{lecture.title}</h4>
                            <Badge variant={lecture.isLive ? 'default' : 'secondary'}>
                              {lecture.isLive ? 'Live' : 'Offline'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Instructor: {lecture.instructor}
                          </p>
                          {lecture.description && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {lecture.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground break-all">
                            URL: {lecture.videoUrl}
                          </p>
                          {lecture.scheduledTime && (
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {new Date(lecture.scheduledTime).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(lecture.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleLectureStatus(lecture.id)}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" />
                            {lecture.isLive ? 'Set Offline' : 'Set Live'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLecture(lecture)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLecture(lecture.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice-zone" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Practice Notes Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Practice Notes
                      </CardTitle>
                      <CardDescription>
                        Upload PDF notes for students to download
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowNoteForm(true)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showNoteForm && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Upload New Note</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleNoteUpload} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="noteTitle">Title *</Label>
                              <Input
                                id="noteTitle"
                                value={noteForm.title}
                                onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter note title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="noteSubject">Subject *</Label>
                              <Input
                                id="noteSubject"
                                value={noteForm.subject}
                                onChange={(e) => setNoteForm(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Enter subject"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="noteDescription">Description</Label>
                            <Textarea
                              id="noteDescription"
                              value={noteForm.description}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter description"
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="noteFile">PDF File *</Label>
                            <Input
                              id="noteFile"
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setNoteForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                              required
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button type="submit" disabled={uploadingFile}>
                              {uploadingFile ? 'Uploading...' : 'Upload Note'}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowNoteForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {practiceNotes.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Notes Uploaded</h3>
                        <p className="text-muted-foreground mb-4">
                          Upload your first practice note to get started
                        </p>
                        <Button 
                          onClick={() => setShowNoteForm(true)}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Note
                        </Button>
                      </div>
                    ) : (
                      practiceNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{note.title}</h4>
                              <Badge variant="outline">{note.subject}</Badge>
                            </div>
                            {note.description && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {note.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Downloads: {note.download_count} • Created: {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(note.file_url, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteNote(note.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Practice Questions Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Practice Quizzes
                      </CardTitle>
                      <CardDescription>
                        Create quizzes and manage questions
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowQuestionForm(true)}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                      Create Quiz
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showQuestionForm && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Create New Quiz</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateQuestion} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="questionTitle">Title *</Label>
                              <Input
                                id="questionTitle"
                                value={questionForm.title}
                                onChange={(e) => setQuestionForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter quiz title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="questionSubject">Subject *</Label>
                              <Input
                                id="questionSubject"
                                value={questionForm.subject}
                                onChange={(e) => setQuestionForm(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Enter subject"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="difficulty">Difficulty *</Label>
                              <select
                                id="difficulty"
                                value={questionForm.difficulty}
                                onChange={(e) => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                required
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
                              <Input
                                id="timeLimit"
                                type="number"
                                min="5"
                                max="180"
                                value={questionForm.time_limit_minutes}
                                onChange={(e) => setQuestionForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) }))}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="questionDescription">Description</Label>
                            <Textarea
                              id="questionDescription"
                              value={questionForm.description}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter description"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button type="submit">
                              Create Quiz
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowQuestionForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {practiceQuestions.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Quizzes Created</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first practice quiz to get started
                        </p>
                        <Button 
                          onClick={() => setShowQuestionForm(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Quiz
                        </Button>
                      </div>
                    ) : (
                      practiceQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{question.title}</h4>
                              <Badge variant="outline">{question.subject}</Badge>
                              <Badge 
                                className={`text-white text-xs ${
                                  question.difficulty === 'Easy' ? 'bg-green-500' :
                                  question.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              >
                                {question.difficulty}
                              </Badge>
                            </div>
                            {question.description && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {question.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Questions: {question.question_items?.[0]?.count || 0} • 
                              Time: {question.time_limit_minutes}min • 
                              Created: {new Date(question.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: 'Feature Coming Soon',
                                  description: 'Question management interface will be available soon.',
                                });
                              }}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Manage
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Back to Main App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;