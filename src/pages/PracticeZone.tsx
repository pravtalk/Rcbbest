import { useState } from "react";
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

interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  downloadUrl?: string;
  isLocked: boolean;
  downloadCount: number;
}

interface Question {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionsCount: number;
  timeLimit: number; // in minutes
  isLocked: boolean;
  completed: boolean;
  score?: number;
}

const PracticeZone = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("notes");

  // Sample data - in real app this would come from API/database
  const notes: Note[] = [
    {
      id: "1",
      title: "JavaScript Fundamentals",
      subject: "Programming",
      description: "Complete guide to JavaScript basics, variables, functions, and more",
      downloadUrl: "/notes/js-fundamentals.pdf",
      isLocked: false,
      downloadCount: 1250
    },
    {
      id: "2", 
      title: "React Components & Hooks",
      subject: "Frontend",
      description: "Advanced React concepts including custom hooks and component patterns",
      downloadUrl: "/notes/react-advanced.pdf",
      isLocked: false,
      downloadCount: 980
    },
    {
      id: "3",
      title: "Node.js & Express",
      subject: "Backend",
      description: "Server-side development with Node.js and Express framework",
      isLocked: true,
      downloadCount: 750
    },
    {
      id: "4",
      title: "Database Design",
      subject: "Database",
      description: "SQL and NoSQL database design principles and best practices",
      isLocked: true,
      downloadCount: 620
    }
  ];

  const questions: Question[] = [
    {
      id: "1",
      title: "JavaScript Basics Quiz",
      subject: "Programming",
      difficulty: "Easy",
      questionsCount: 15,
      timeLimit: 20,
      isLocked: false,
      completed: true,
      score: 85
    },
    {
      id: "2",
      title: "React Advanced Concepts",
      subject: "Frontend", 
      difficulty: "Medium",
      questionsCount: 25,
      timeLimit: 30,
      isLocked: false,
      completed: false
    },
    {
      id: "3",
      title: "Full Stack Challenge",
      subject: "Full Stack",
      difficulty: "Hard",
      questionsCount: 40,
      timeLimit: 60,
      isLocked: true,
      completed: false
    },
    {
      id: "4",
      title: "Data Structures & Algorithms",
      subject: "Computer Science",
      difficulty: "Hard",
      questionsCount: 30,
      timeLimit: 45,
      isLocked: true,
      completed: false
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDownloadNote = (note: Note) => {
    if (note.isLocked) {
      // Handle premium/locked content
      console.log('Note is locked - redirect to premium');
      return;
    }
    
    if (note.downloadUrl) {
      // In real app, this would trigger actual download
      console.log(`Downloading: ${note.title}`);
    }
  };

  const handleStartQuiz = (question: Question) => {
    if (question.isLocked) {
      // Handle premium/locked content
      console.log('Quiz is locked - redirect to premium');
      return;
    }
    
    // Navigate to quiz page (to be implemented)
    console.log(`Starting quiz: ${question.title}`);
  };

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
                PREMIUM
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
                  <p className="text-xl font-bold">{notes.length}</p>
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
                  <p className="text-xl font-bold">{questions.length}</p>
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
                  <p className="text-xl font-bold">{questions.filter(q => q.completed).length}</p>
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
                  <p className="text-xl font-bold">85%</p>
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
                          {note.isLocked && (
                            <Badge variant="secondary" className="bg-warning text-black">
                              PRO
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {note.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {note.downloadCount.toLocaleString()} downloads
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            PDF Format
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant={note.isLocked ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleDownloadNote(note)}
                        className="ml-4"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {note.isLocked ? 'Unlock' : 'Download'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Practice Questions</h2>
              <Badge variant="secondary">{questions.length} Available</Badge>
            </div>
            
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
                          {question.isLocked && (
                            <Badge variant="secondary" className="bg-warning text-black">
                              PRO
                            </Badge>
                          )}
                          {question.completed && (
                            <Badge variant="default" className="bg-green-500 text-white">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            {question.questionsCount} questions
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {question.timeLimit} minutes
                          </div>
                          {question.completed && question.score && (
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              Score: {question.score}%
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant={question.completed ? "outline" : question.isLocked ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleStartQuiz(question)}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {question.completed ? 'Retake' : question.isLocked ? 'Unlock' : 'Start Quiz'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default PracticeZone;