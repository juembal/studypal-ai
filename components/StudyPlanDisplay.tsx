'use client'

import { useState, useEffect } from 'react'
import { StudyPlan } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import FlashcardQuiz from '@/components/FlashcardQuiz'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, Clock, BookOpen, Lightbulb, Target, Download, Brain, CheckCircle, Circle, ExternalLink, Play, FileText, Code, Award, DollarSign } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Helper function to format duration from decimal hours to hours and minutes
const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (wholeHours === 0) {
    return `${minutes}min`
  } else if (minutes === 0) {
    return `${wholeHours}h`
  } else {
    return `${wholeHours}h ${minutes}min`
  }
}

interface StudyPlanDisplayProps {
  studyPlan: StudyPlan
  onNewPlan: () => void
}

// Add this interface for the updated study plan
interface StudyPlanDisplayState {
  studyPlan: StudyPlan
  setStudyPlan: (plan: StudyPlan) => void
}

interface SessionCompletion {
  [key: string]: boolean // key format: "day-subjectIndex" e.g., "Monday-0"
}

export default function StudyPlanDisplay({ studyPlan: initialStudyPlan, onNewPlan }: StudyPlanDisplayProps) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(initialStudyPlan)
  const [showQuiz, setShowQuiz] = useState(false)
  const [sessionCompletions, setSessionCompletions] = useState<SessionCompletion>({})
  const [planId, setPlanId] = useState<string>('')

  // Update local state when prop changes
  useEffect(() => {
    setStudyPlan(initialStudyPlan)
  }, [initialStudyPlan])
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    day: string
    subjectIndex: number
    subject: any
    isCurrentlyCompleted: boolean
  }>({
    isOpen: false,
    day: '',
    subjectIndex: -1,
    subject: null,
    isCurrentlyCompleted: false
  })

  // Generate a unique plan ID based on study plan content
  useEffect(() => {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setPlanId(id)
    
    // Load existing completions for this plan
    const savedCompletions = localStorage.getItem(`completions_${id}`)
    if (savedCompletions) {
      setSessionCompletions(JSON.parse(savedCompletions))
    }
  }, [studyPlan])

  // Save completions to localStorage whenever they change
  useEffect(() => {
    if (planId) {
      localStorage.setItem(`completions_${planId}`, JSON.stringify(sessionCompletions))
    }
  }, [sessionCompletions, planId])

  const openConfirmDialog = (day: string, subjectIndex: number, subject: any) => {
    const key = `${day}-${subjectIndex}`
    const isCurrentlyCompleted = sessionCompletions[key] || false
    
    setConfirmDialog({
      isOpen: true,
      day,
      subjectIndex,
      subject,
      isCurrentlyCompleted
    })
  }

  const handleConfirmToggle = () => {
    const { day, subjectIndex } = confirmDialog
    const key = `${day}-${subjectIndex}`
    
    setSessionCompletions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleCancelToggle = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }


  const isSessionCompleted = (day: string, subjectIndex: number) => {
    const key = `${day}-${subjectIndex}`
    return sessionCompletions[key] || false
  }

  const getDayProgress = (day: string, schedule: any) => {
    if (!schedule.subjects || !Array.isArray(schedule.subjects)) {
      return { completed: 0, total: 0 }
    }
    
    const totalSessions = schedule.subjects.length
    const completedSessions = schedule.subjects.filter((_: any, index: number) => 
      isSessionCompleted(day, index)
    ).length
    return { completed: completedSessions, total: totalSessions }
  }

  const getDateForDay = (dayName: string): string => {
    const today = new Date()
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const currentDayIndex = today.getDay()
    const targetDayIndex = daysOfWeek.indexOf(dayName)
    
    if (targetDayIndex === -1) return ''
    
    // Calculate days until target day (this week or next week)
    let daysUntilTarget = targetDayIndex - currentDayIndex
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7 // Next week
    }
    
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntilTarget)
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    }
    
    return targetDate.toLocaleDateString('en-US', options)
  }
  const downloadPlan = () => {
    const planText = `
STUDY PLAN GENERATED BY STUDYPAL AI
=====================================

WEEKLY SCHEDULE:
${studyPlan.weeklySchedule ? Object.entries(studyPlan.weeklySchedule).map(([day, schedule]) => `
${day.toUpperCase()}:
${schedule.subjects.map(subject => 
  `  • ${subject.subject} (${formatDuration(subject.duration)}) - ${subject.timeSlot}
    Focus: ${subject.focus}
    Priority: ${subject.priority}`
).join('\n')}
Total Hours: ${schedule.totalHours}h
`).join('\n') : 'No weekly schedule available'}

REVISION SCHEDULE:
${studyPlan.revisionSchedule ? studyPlan.revisionSchedule.map(item => 
  `• ${item.date} - ${item.subject} (${formatDuration(item.duration)})
  Topics: ${item.topics.join(', ')}`
).join('\n') : 'No revision schedule available'}

LEARNING TIPS:
${studyPlan.learningTips ? studyPlan.learningTips.map((tip, index) => `${index + 1}. ${tip}`).join('\n') : 'No learning tips available'}

EXAM STRATEGY:
${studyPlan.examStrategy ? studyPlan.examStrategy.map((strategy, index) => `${index + 1}. ${strategy}`).join('\n') : 'No exam strategy available'}

FLASHCARDS:
${studyPlan.flashcards ? studyPlan.flashcards.map((card, index) => 
  `${index + 1}. [${card.subject}] ${card.question}
   Answer: ${card.answer}
   Difficulty: ${card.difficulty}`
).join('\n') : 'No flashcards available'}
    `
    
    const blob = new Blob([planText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'study-plan.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (showQuiz && studyPlan.flashcards && studyPlan.flashcards.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FlashcardQuiz 
          flashcards={studyPlan.flashcards} 
          onClose={() => setShowQuiz(false)} 
        />
      </div>
    )
  }

  // Debug: Log the study plan structure
  console.log('StudyPlan data:', studyPlan)
  console.log('Has weeklySchedule:', !!studyPlan.weeklySchedule)
  console.log('Has sessions:', !!studyPlan.sessions)
  if (studyPlan.weeklySchedule) {
    console.log('WeeklySchedule structure:', studyPlan.weeklySchedule)
    // Log first subject to see its properties
    const firstDay = Object.values(studyPlan.weeklySchedule)[0] as any
    if (firstDay?.subjects?.[0]) {
      console.log('First subject properties:', Object.keys(firstDay.subjects[0]))
      console.log('First subject data:', firstDay.subjects[0])
    }
  }
  if (studyPlan.sessions) {
    console.log('Sessions structure:', studyPlan.sessions)
    // Log first session to see its properties
    if (studyPlan.sessions[0]) {
      console.log('First session properties:', Object.keys(studyPlan.sessions[0]))
      console.log('First session data:', studyPlan.sessions[0])
    }
  }
  
  // Also check localStorage for existing plans
  try {
    const savedPlans = localStorage.getItem('studypal_plans')
    if (savedPlans) {
      const plans = JSON.parse(savedPlans)
      console.log('Saved plans in localStorage:', plans)
      if (plans[0]?.fullPlan) {
        console.log('First saved plan structure:', plans[0].fullPlan)
      }
    }
  } catch (e) {
    console.log('No saved plans or error reading localStorage')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Personalized Study Plan</h1>
          <p className="text-gray-600 mt-2">AI-generated plan tailored to your needs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPlan} className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
            <Download className="h-4 w-4 mr-2" />
            Download Plan
          </Button>
          {studyPlan.flashcards && studyPlan.flashcards.length > 0 && (
            <Button onClick={() => setShowQuiz(true)} className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui">
              <Brain className="h-4 w-4 mr-2" />
              Take Quiz ({studyPlan.flashcards.length} cards)
            </Button>
          )}
          <Button onClick={onNewPlan} className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui">
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Your daily study routine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Handle both weeklySchedule and sessions data structures */}
            {studyPlan.weeklySchedule ? 
              Object.entries(studyPlan.weeklySchedule)
                .filter(([day, schedule]) => schedule.subjects && schedule.subjects.length > 0)
                .map(([day, schedule]) => {
              const dayProgress = getDayProgress(day, schedule)
              const progressPercentage = schedule.subjects?.length ? (dayProgress.completed / dayProgress.total) * 100 : 0
              
              return (
                <div key={day} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {day}, {getDateForDay(day)}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{schedule.totalHours}h total</Badge>
                        <Badge variant={progressPercentage === 100 ? 'default' : 'outline'} className="text-xs">
                          {dayProgress.completed}/{dayProgress.total} done
                        </Badge>
                      </div>
                    </div>
                    {schedule.subjects?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {schedule.subjects && Array.isArray(schedule.subjects) ? schedule.subjects.map((subject, index) => {
                      const isCompleted = isSessionCompleted(day, index)
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 shadow-sm' 
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-studypal-blue/5 hover:to-studypal-cyan/5 border border-gray-200 hover:border-studypal-blue/20 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left side - Completion toggle and subject info */}
                            <div className="flex items-center gap-3 flex-1">
                              {/* Completion Toggle */}
                              <button
                                onClick={() => openConfirmDialog(day, index, subject)}
                                className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                                  isCompleted 
                                    ? 'text-green-600 hover:text-green-700' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete'}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>
                              
                              {/* Subject Information */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <BookOpen className="h-4 w-4" />
                                  <span className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {subject.subject || 'Study Session'}
                                  </span>
                                  <Badge 
                                    variant={subject.priority === 'high' ? 'destructive' : subject.priority === 'medium' ? 'default' : 'secondary'}
                                  >
                                    {subject.priority || 'medium'}
                                  </Badge>
                                </div>
                                <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                  {subject.focus || 'Study focus'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Right side - Time and duration info */}
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                <Clock className="h-3 w-3" />
                                <span className={isCompleted ? 'line-through' : ''}>
                                  {subject.timeSlot || 'Time TBD'}
                                </span>
                              </div>
                              <div className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                                {formatDuration(subject.duration || 1)} duration
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="text-gray-500 text-sm">No subjects scheduled for this day</div>
                    )}
                  </div>
                  
                  {/* Day Summary */}
                  {schedule.subjects?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {progressPercentage === 100 ? (
                            <span className="text-green-600 font-medium">✅ Day completed!</span>
                          ) : (
                            `${dayProgress.completed} of ${dayProgress.total} sessions completed`
                          )}
                        </span>
                        {progressPercentage > 0 && progressPercentage < 100 && (
                          <span className="text-blue-600 font-medium">
                            {dayProgress.total - dayProgress.completed} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            }) : 
            /* Handle sessions array structure */
            studyPlan.sessions ? 
              (() => {
                // Group sessions by day
                const sessionsByDay = studyPlan.sessions.reduce((acc: any, session: any) => {
                  const day = session.day || 'Unknown'
                  if (!acc[day]) {
                    acc[day] = []
                  }
                  acc[day].push(session)
                  return acc
                }, {})

                return Object.entries(sessionsByDay).map(([day, sessions]: [string, any]) => {
                  const dayProgress = { completed: 0, total: sessions.length }
                  const completedSessions = sessions.filter((_: any, index: number) => 
                    isSessionCompleted(day, index)
                  ).length
                  dayProgress.completed = completedSessions
                  const progressPercentage = sessions.length ? (dayProgress.completed / dayProgress.total) * 100 : 0
                  const totalHours = sessions.reduce((acc: number, session: any) => acc + (session.duration || 0), 0)

                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {day}, {getDateForDay(day)}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{totalHours}h total</Badge>
                            <Badge variant={progressPercentage === 100 ? 'default' : 'outline'} className="text-xs">
                              {dayProgress.completed}/{dayProgress.total} done
                            </Badge>
                          </div>
                        </div>
                        {sessions.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {sessions.map((session: any, index: number) => {
                          const isCompleted = isSessionCompleted(day, index)
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-4 rounded-xl transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 shadow-sm' 
                                  : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-studypal-blue/5 hover:to-studypal-cyan/5 border border-gray-200 hover:border-studypal-blue/20 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                {/* Left side - Completion toggle and subject info */}
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Completion Toggle */}
                                  <button
                                    onClick={() => openConfirmDialog(day, index, session)}
                                    className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                                      isCompleted 
                                        ? 'text-green-600 hover:text-green-700' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                    title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete'}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : (
                                      <Circle className="h-5 w-5" />
                                    )}
                                  </button>
                                  
                                  {/* Subject Information */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <BookOpen className="h-4 w-4" />
                                      <span className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                        {session.subject || 'Study Session'}
                                      </span>
                                      <Badge 
                                        variant={session.type === 'assessment' ? 'destructive' : session.type === 'practice' ? 'default' : 'secondary'}
                                      >
                                        {session.type || 'study'}
                                      </Badge>
                                    </div>
                                    <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                      {session.topic || session.notes || session.materials?.join(', ') || 'Study session'}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Right side - Time and duration info */}
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                    <Clock className="h-3 w-3" />
                                    <span className={isCompleted ? 'line-through' : ''}>
                                      {session.timeSlot || session.date || 'Time TBD'}
                                    </span>
                                  </div>
                                  <div className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                                    {formatDuration(session.duration || 1)} duration
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Day Summary */}
                      {sessions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {progressPercentage === 100 ? (
                                <span className="text-green-600 font-medium">✅ Day completed!</span>
                              ) : (
                                `${dayProgress.completed} of ${dayProgress.total} sessions completed`
                              )}
                            </span>
                            {progressPercentage > 0 && progressPercentage < 100 && (
                              <span className="text-blue-600 font-medium">
                                {dayProgress.total - dayProgress.completed} remaining
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              })() : 
              <div className="text-gray-500 text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No study schedule available. Please generate a new study plan.</p>
                {/* Debug: Show raw data structure */}
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
                  <p className="font-bold mb-2">Debug - Raw Study Plan Data:</p>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                    {JSON.stringify(studyPlan, null, 2)}
                  </pre>
                </div>
              </div>
            }
          </div>
        </CardContent>
      </Card>


      {/* Learning Tips & Exam Strategy */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Learning Tips
            </CardTitle>
            <CardDescription>Personalized study advice</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {studyPlan.learningTips && Array.isArray(studyPlan.learningTips) ? studyPlan.learningTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{tip}</span>
                </li>
              )) : (
                <li className="text-gray-500 text-sm">No learning tips available</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Exam Strategy
            </CardTitle>
            <CardDescription>Tips for exam success</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {studyPlan.examStrategy && Array.isArray(studyPlan.examStrategy) ? studyPlan.examStrategy.map((strategy, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{strategy}</span>
                </li>
              )) : (
                <li className="text-gray-500 text-sm">No exam strategies available</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Online Learning Resources */}
      {studyPlan.onlineResources && studyPlan.onlineResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Online Learning Resources
            </CardTitle>
            <CardDescription>Curated resources for your specific topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {studyPlan.onlineResources.map((resource, index) => {
                const getResourceIcon = (type: string) => {
                  switch (type) {
                    case 'video': return <Play className="h-4 w-4" />
                    case 'course': return <Award className="h-4 w-4" />
                    case 'article': return <FileText className="h-4 w-4" />
                    case 'practice': return <Code className="h-4 w-4" />
                    case 'documentation': return <BookOpen className="h-4 w-4" />
                    default: return <ExternalLink className="h-4 w-4" />
                  }
                }

                const getResourceColor = (type: string) => {
                  switch (type) {
                    case 'video': return 'text-red-600 bg-red-50'
                    case 'course': return 'text-blue-600 bg-blue-50'
                    case 'article': return 'text-green-600 bg-green-50'
                    case 'practice': return 'text-studypal-amber bg-studypal-amber/10'
                    case 'documentation': return 'text-orange-600 bg-orange-50'
                    default: return 'text-gray-600 bg-gray-50'
                  }
                }

                return (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getResourceColor(resource.type)}`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{resource.title}</h4>
                          <p className="text-sm text-gray-600">{resource.topic}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {resource.isFree ? (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Paid
                          </Badge>
                        )}
                        <Badge 
                          variant={resource.difficulty === 'advanced' ? 'destructive' : resource.difficulty === 'intermediate' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {resource.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.estimatedTime}
                        </span>
                        <span className="capitalize">{resource.type}</span>
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Open Resource
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flashcards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Flashcards
          </CardTitle>
          <CardDescription>Key concepts to memorize</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyPlan.flashcards && Array.isArray(studyPlan.flashcards) ? studyPlan.flashcards.map((card, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {card.subject}
                  </Badge>
                  <Badge 
                    variant={card.difficulty === 'hard' ? 'destructive' : card.difficulty === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {card.difficulty}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Q:</p>
                    <p className="text-sm">{card.question}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">A:</p>
                    <p className="text-sm text-gray-600">{card.answer}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-sm">No flashcards available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelToggle()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.isCurrentlyCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.isCurrentlyCompleted ? 'mark as incomplete' : 'mark as complete'} this study session?
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog.subject && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{confirmDialog.subject.subject}</span>
                  <Badge variant={confirmDialog.subject.priority === 'high' ? 'destructive' : confirmDialog.subject.priority === 'medium' ? 'default' : 'secondary'}>
                    {confirmDialog.subject.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{confirmDialog.subject.focus}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {confirmDialog.subject.timeSlot}
                  </span>
                  <span>{formatDuration(confirmDialog.subject.duration)} duration</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button onClick={handleCancelToggle} className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmToggle}
              className={confirmDialog.isCurrentlyCompleted ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {confirmDialog.isCurrentlyCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}