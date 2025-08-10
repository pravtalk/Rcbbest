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
import { Users, Settings, GraduationCap, Video, Trash2, Plus, Play, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedBatchManagement from '@/components/EnhancedBatchManagement';

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
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
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

      // Load live lectures from localStorage
      const savedLectures = localStorage.getItem('liveLectures');
      if (savedLectures) {
        setLiveLectures(JSON.parse(savedLectures));
      }

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

  const saveLiveLectures = (lectures: LiveLecture[]) => {
    localStorage.setItem('liveLectures', JSON.stringify(lectures));
    setLiveLectures(lectures);
  };

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

  const handleLiveFormSubmit = (e: React.FormEvent) => {
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
      const newLecture: LiveLecture = {
        id: editingLecture?.id || Date.now().toString(),
        title: liveForm.title.trim(),
        description: liveForm.description.trim(),
        videoUrl: liveForm.videoUrl.trim(),
        instructor: liveForm.instructor.trim(),
        isLive: true,
        scheduledTime: liveForm.scheduledTime || undefined,
        createdAt: editingLecture?.createdAt || new Date().toISOString()
      };

      let updatedLectures;
      if (editingLecture) {
        updatedLectures = liveLectures.map(lecture => 
          lecture.id === editingLecture.id ? newLecture : lecture
        );
      } else {
        updatedLectures = [...liveLectures, newLecture];
      }

      saveLiveLectures(updatedLectures);
      
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

  const handleDeleteLecture = (lectureId: string) => {
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

      const updatedLectures = liveLectures.filter(lecture => lecture.id !== lectureId);
      saveLiveLectures(updatedLectures);
      
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

  const toggleLectureStatus = (lectureId: string) => {
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

      const updatedLectures = liveLectures.map(lecture => 
        lecture.id === lectureId ? { ...lecture, isLive: !lecture.isLive } : lecture
      );
      saveLiveLectures(updatedLectures);
      
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batches" className="text-xs sm:text-sm">Batches</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="live-lectures" className="text-xs sm:text-sm">Live Lectures</TabsTrigger>
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