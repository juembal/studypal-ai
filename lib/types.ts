// Type definitions for StudyPal AI

export interface StudyPlanRequest {
  subjects: string[]
  studyLevel: 'high-school' | 'undergraduate' | 'graduate' | 'professional'
  dailyHours: number
  targetDate: string
  goals?: string
  preferences?: string
  currentKnowledge?: string
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export interface StudySession {
  id: string
  day: string
  date: string
  subject: string
  topic: string
  duration: number
  type: 'lecture' | 'practice' | 'review' | 'assessment'
  materials?: string[]
  notes?: string
  completed?: boolean
}

export interface StudyPlan {
  id: string
  name: string
  subjects: string[]
  studyLevel: string
  totalHours: number
  dailyHours: number
  startDate: string
  targetDate: string
  goals?: string
  sessions: StudySession[]
  flashcards?: Flashcard[]
  progress?: {
    completedSessions: number
    totalSessions: number
    completedHours: number
    totalHours: number
  }
  status?: 'active' | 'completed' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface Flashcard {
  id: string
  subject: string
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
  lastReviewed?: string
  nextReview?: string
  correctCount?: number
  incorrectCount?: number
}