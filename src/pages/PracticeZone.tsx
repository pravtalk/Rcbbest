import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  FileText, 
  Download, 
  Play, 
  CheckCircle, 
  Clock, 
  Target,
  Award,
  Zap,
  Brain
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  file_url: string;
  download_count: number;
  created_at: string;
}

interface Question {
  id: string;
  title: string;
  subject: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_limit_minutes: number;
  created_at: string;
  question_count?: number;
  user_attempts?: {
    score: number;
    completed_at: string;
  }[];
}

const PracticeZone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalQuestions: 0,
    completedQuizzes: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchPracticeData();
  }, [user]);

  // Real-time updates subscription
  useEffect(() => {
    // Subscribe to practice notes changes
    const notesSubscription = supabase
      .channel('practice_notes_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'practice_notes' },
        (payload) => {
          console.log('Practice notes change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPracticeNotes(prev => [payload.new as Note, ...prev]);
            setStats(prev => ({ ...prev, totalNotes: prev.totalNotes + 1 }));
            toast({
              title: "New Study Note Available!",
              description: `"${payload.new.title}" has been added.`,
            });
          } else if (payload.eventType === 'DELETE') {
            setPracticeNotes(prev => prev.filter(note => note.id !== payload.old.id));
            setStats(prev => ({ ...prev, totalNotes: Math.max(0, prev.totalNotes - 1) }));
          } else if (payload.eventType === 'UPDATE') {
            setPracticeNotes(prev => prev.map(note => 
              note.id === payload.new.id ? { ...note, ...payload.new } : note
            ));
          }
        }
      )
      .subscribe();

    // Subscribe to practice questions changes
    const questionsSubscription = supabase
      .channel('practice_questions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'practice_questions' },
        (payload) => {
          console.log('Practice questions change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newQuestion = { ...payload.new, question_items: [{ count: 0 }] };
            setPracticeQuestions(prev => [newQuestion as Question, ...prev]);
            setStats(prev => ({ ...prev, totalQuestions: prev.totalQuestions + 1 }));
            toast({
              title: "New Quiz Available!",
              description: `"${payload.new.title}" quiz has been created.`,
            });
          } else if (payload.eventType === 'DELETE') {
            setPracticeQuestions(prev => prev.filter(q => q.id !== payload.old.id));
            setStats(prev => ({ ...prev, totalQuestions: Math.max(0, prev.totalQuestions - 1) }));
          } else if (payload.eventType === 'UPDATE') {
            setPracticeQuestions(prev => prev.map(q => 
              q.id === payload.new.id ? { ...q, ...payload.new } : q
            ));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notesSubscription);
      supabase.removeChannel(questionsSubscription);
    };
  }, []);

  const fetchPracticeData = async () => {
    try {
      setLoading(true);

      // Fetch practice notes
      const { data: notesData, error: notesError } = await supabase
        .from('practice_notes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch practice questions with question count
      const { data: questionsData, error: questionsError } = await supabase
        .from('practice_questions')
        .select(`
          *,
          question_items(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch user quiz attempts if logged in
      let userAttempts: any[] = [];
      if (user) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('user_quiz_attempts')
          .select('practice_question_id, score, completed_at')
          .eq('user_id', user.id);

        if (attemptsError) throw attemptsError;
        userAttempts = attemptsData || [];
      }

      // Process questions data
      const processedQuestions = questionsData?.map(q => ({
        ...q,
        question_count: q.question_items?.[0]?.count || 0,
        user_attempts: userAttempts.filter(attempt => attempt.practice_question_id === q.id)
      })) || [];

      setNotes(notesData || []);
      setQuestions(processedQuestions);

      // Calculate stats
      const completedQuizzes = new Set(userAttempts.map(a => a.practice_question_id)).size;
      const averageScore = userAttempts.length > 0 
        ? Math.round(userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length)
        : 0;

      setStats({
        totalNotes: notesData?.length || 0,
        totalQuestions: questionsData?.length || 0,
        completedQuizzes,
        averageScore
      });

    } catch (error) {
      console.error('Error fetching practice data:', error);
      toast({
        title: "Error",
        description: "Failed to load practice zone data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDownloadNote = async (note: Note) => {
    try {
      // Increment download count
      await supabase.rpc('increment_download_count', { note_id: note.id });
      
      // Create download link
      const link = document.createElement('a');
      link.href = note.file_url;
      link.download = `${note.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update local state
      setNotes(prev => prev.map(n => 
        n.id === note.id 
          ? { ...n, download_count: n.download_count + 1 }
          : n
      ));

      toast({
        title: "Download Started",
        description: `${note.title} is being downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading note:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartQuiz = (question: Question) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to take quizzes.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    // Navigate to quiz page (to be implemented)
    toast({
      title: "Quiz Feature",
      description: "Quiz interface will be implemented soon!",
    });
  };

  const isQuizCompleted = (question: Question) => {
    return question.user_attempts && question.user_attempts.length > 0;
  };

  const getQuizScore = (question: Question) => {
    if (!question.user_attempts || question.user_attempts.length === 0) return null;
    return Math.max(...question.user_attempts.map(a => a.score));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading practice zone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  Practice Zone
                </h1>
                <p className="text-sm text-muted-foreground">
                  Master your skills with notes and practice questions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gradient-accent text-accent-foreground">
                LEARNING
              </Badge>
              <Badge variant="outline" className="bg-info text-white">
                <Target className="w-3 h-3 mr-1" />
                PRACTICE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-xl font-bold">{stats.totalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes</p>
                  <p className="text-xl font-bold">{stats.totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{stats.completedQuizzes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-xl font-bold">{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notes" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Study Notes
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Practice Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Study Notes</h2>
              <Badge variant="secondary">{notes.length} Available</Badge>
            </div>
            
            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Notes Available</h3>
                  <p className="text-muted-foreground">
                    Study notes will appear here once uploaded by the admin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {notes.map((note) => (
                  <Card key={note.id} className="gradient-card border border-border hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{note.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {note.subject}
                            </Badge>
                          </div>
                          
                          {note.description && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {note.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {note.download_count.toLocaleString()} downloads
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              PDF Format
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleDownloadNote(note)}
                          className="ml-4"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Practice Questions</h2>
              <Badge variant="secondary">{questions.length} Available</Badge>
            </div>
            
            {questions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Quizzes Available</h3>
                  <p className="text-muted-foreground">
                    Practice quizzes will appear here once created by the admin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {questions.map((question) => (
                  <Card key={question.id} className="gradient-card border border-border hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{question.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {question.subject}
                            </Badge>
                            <Badge 
                              className={`text-white text-xs ${getDifficultyColor(question.difficulty)}`}
                            >
                              {question.difficulty}
                            </Badge>
                            {isQuizCompleted(question) && (
                              <Badge variant="default" className="bg-green-500 text-white">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                          
                          {question.description && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {question.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Brain className="w-4 h-4" />
                              {question.question_count || 0} questions
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {question.time_limit_minutes} minutes
                            </div>
                            {isQuizCompleted(question) && (
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                Best Score: {getQuizScore(question)}%
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          variant={isQuizCompleted(question) ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleStartQuiz(question)}
                          className="ml-4"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {isQuizCompleted(question) ? 'Retake' : 'Start Quiz'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default PracticeZone;