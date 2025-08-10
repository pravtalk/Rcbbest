-- Create practice_notes table for PDF notes uploaded by admin
CREATE TABLE public.practice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create practice_questions table for quizzes created by admin
CREATE TABLE public.practice_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create individual questions within a practice quiz
CREATE TABLE public.question_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_question_id UUID NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user quiz attempts table
CREATE TABLE public.user_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_question_id UUID NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_taken_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answers JSONB -- Store user answers
);

-- Create storage bucket for practice notes PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('practice-notes', 'practice-notes', true);

-- Enable Row Level Security
ALTER TABLE public.practice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_notes
CREATE POLICY "Practice notes are viewable by everyone" 
ON public.practice_notes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all practice notes" 
ON public.practice_notes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for practice_questions
CREATE POLICY "Practice questions are viewable by everyone" 
ON public.practice_questions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all practice questions" 
ON public.practice_questions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for question_items
CREATE POLICY "Question items are viewable by everyone" 
ON public.question_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.practice_questions 
  WHERE id = practice_question_id AND is_active = true
));

CREATE POLICY "Admin can manage all question items" 
ON public.question_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_quiz_attempts
CREATE POLICY "Users can view their own quiz attempts" 
ON public.user_quiz_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" 
ON public.user_quiz_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all quiz attempts" 
ON public.user_quiz_attempts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for practice notes
CREATE POLICY "Practice note files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'practice-notes');

CREATE POLICY "Admin can upload practice note files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'practice-notes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update practice note files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'practice-notes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete practice note files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'practice-notes' AND has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_practice_notes_updated_at
BEFORE UPDATE ON public.practice_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_questions_updated_at
BEFORE UPDATE ON public.practice_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(note_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.practice_notes 
  SET download_count = download_count + 1 
  WHERE id = note_id;
$$;