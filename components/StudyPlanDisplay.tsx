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
import { Calendar, Clock, BookOpen, Lightbulb, Target, Download, Brain, CheckCircle, Circle, ExternalLink, Play, FileText, Code, Award, DollarSign, Edit2, Save, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
  const [editingSession, setEditingSession] = useState<{
    day: string
    index: number
    tempData: {
      timeSlot: string
      startTime: string
      duration: number
      subject: string
      focus: string
      day: string
    }
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [editConflictDialog, setEditConflictDialog] = useState<{
    isOpen: boolean
    conflicts: string[]
    sessionData: any
  }>({
    isOpen: false,
    conflicts: [],
    sessionData: null
  })
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

  const startEditingSession = (day: string, index: number, session: any) => {
    const startTime = session.timeSlot?.split(' - ')[0] || '9:00 AM'
    
    setEditingSession({
      day,
      index,
      tempData: {
        timeSlot: session.timeSlot,
        startTime: startTime,
        duration: session.duration,
        subject: session.subject,
        focus: session.focus,
        day: day
      }
    })
  }

  const cancelEditingSession = async () => {
    setIsCanceling(true)
    
    // Add a smooth transition delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setEditingSession(null)
    setIsCanceling(false)
  }

  const checkEditConflicts = () => {
    if (!editingSession) return []
    
    const conflicts: string[] = []
    const { tempData } = editingSession
    
    // Check conflicts with other sessions in the same day
    Object.entries(studyPlan.weeklySchedule).forEach(([day, schedule]) => {
      if (schedule.subjects && Array.isArray(schedule.subjects)) {
        schedule.subjects.forEach((subject, index) => {
          // Skip the session being edited
          if (day === editingSession.day && index === editingSession.index) return
          
          // Check if time slots overlap
          if (subject.timeSlot === tempData.timeSlot) {
            conflicts.push(`${day}: ${subject.subject} at ${subject.timeSlot}`)
          }
        })
      }
    })
    
    return conflicts
  }

  const saveEditedSession = async (forceOverride = false) => {
    if (!editingSession) return

    setIsSaving(true)

    // Check for conflicts unless forcing override
    if (!forceOverride) {
      const conflicts = checkEditConflicts()
      if (conflicts.length > 0) {
        setIsSaving(false)
        setEditConflictDialog({
          isOpen: true,
          conflicts,
          sessionData: editingSession.tempData
        })
        return
      }
    }

    // Create a deep copy of the study plan
    const updatedStudyPlan = JSON.parse(JSON.stringify(studyPlan))
    const originalDay = editingSession.day
    const newDay = editingSession.tempData.day
    const sessionIndex = editingSession.index

    // Remove session from original day
    if (updatedStudyPlan.weeklySchedule[originalDay]?.subjects) {
      updatedStudyPlan.weeklySchedule[originalDay].subjects.splice(sessionIndex, 1)
      // Recalculate total hours for original day
      updatedStudyPlan.weeklySchedule[originalDay].totalHours = 
        updatedStudyPlan.weeklySchedule[originalDay].subjects.reduce((total: number, subject: any) => total + subject.duration, 0)
    }

    // Add session to new day (or same day if not changed)
    if (!updatedStudyPlan.weeklySchedule[newDay]) {
      updatedStudyPlan.weeklySchedule[newDay] = { subjects: [], totalHours: 0 }
    }
    
    const updatedSession = {
      subject: editingSession.tempData.subject,
      duration: editingSession.tempData.duration,
      timeSlot: editingSession.tempData.timeSlot,
      focus: editingSession.tempData.focus,
      priority: 'medium' // Default priority
    }

    updatedStudyPlan.weeklySchedule[newDay].subjects.push(updatedSession)
    // Recalculate total hours for new day
    updatedStudyPlan.weeklySchedule[newDay].totalHours = 
      updatedStudyPlan.weeklySchedule[newDay].subjects.reduce((total: number, subject: any) => total + subject.duration, 0)

    // Update the stored plan in localStorage
    try {
      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = existingPlans.map((plan: any) => {
        if (plan.fullPlan) {
          // Match by plan structure similarity instead of exact JSON match
          const planSubjects = Object.values(plan.fullPlan.weeklySchedule || {})
            .flatMap((day: any) => day.subjects || [])
            .map((s: any) => s.subject)
            .sort()
          
          const currentSubjects = Object.values(studyPlan.weeklySchedule || {})
            .flatMap((day: any) => day.subjects || [])
            .map((s: any) => s.subject)
            .sort()
          
          if (JSON.stringify(planSubjects) === JSON.stringify(currentSubjects)) {
            return { ...plan, fullPlan: updatedStudyPlan }
          }
        }
        return plan
      })
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error updating stored plan:', error)
    }

    // Add a smooth transition delay before completing
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the current display without triggering navigation
    setStudyPlan(updatedStudyPlan)
    setEditingSession(null)
    setEditConflictDialog({ isOpen: false, conflicts: [], sessionData: null })
    setIsSaving(false)
  }

  const updateEditingField = (field: string, value: any) => {
    if (!editingSession) return
    
    setEditingSession(prev => {
      const newTempData = {
        ...prev!.tempData,
        [field]: value
      }
      
      // If duration changes, update the timeSlot to reflect new end time
      if (field === 'duration' || field === 'startTime') {
        const startTime = field === 'startTime' ? value : prev!.tempData.startTime || prev!.tempData.timeSlot?.split(' - ')[0]
        const duration = field === 'duration' ? value : prev!.tempData.duration
        
        if (startTime && duration) {
          newTempData.timeSlot = calculateEndTime(startTime, duration)
          newTempData.startTime = startTime
        }
      }
      
      return {
        ...prev!,
        tempData: newTempData
      }
    })
  }

  const getStartTimeOptions = () => {
    const startTimes = []
    
    // Generate start times for full 24 hours in 30-minute intervals
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date()
        time.setHours(hour, minute, 0, 0)
        
        const formatTime = (date: Date) => {
          let hours = date.getHours()
          const minutes = date.getMinutes()
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12
          hours = hours ? hours : 12
          const minutesStr = minutes === 0 ? '00' : minutes.toString()
          return `${hours}:${minutesStr} ${ampm}`
        }
        
        startTimes.push(formatTime(time))
      }
    }
    
    return startTimes
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime || !duration) return ''
    
    try {
      const [time, ampm] = startTime.split(' ')
      const [hours, minutes] = time.split(':').map(Number)
      
      let hour24 = hours
      if (ampm === 'PM' && hours !== 12) hour24 += 12
      if (ampm === 'AM' && hours === 12) hour24 = 0
      
      const startDate = new Date()
      startDate.setHours(hour24, minutes, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setHours(startDate.getHours() + Math.floor(duration), startDate.getMinutes() + (duration % 1) * 60)
      
      const formatTime = (date: Date) => {
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        const minutesStr = minutes === 0 ? '00' : minutes.toString()
        return `${hours}:${minutesStr} ${ampm}`
      }
      
      // Check if session goes into next day
      const startDay = startDate.getDate()
      const endDay = endDate.getDate()
      const nextDay = startDay !== endDay ? ' (+1 day)' : ''
      
      return `${startTime} - ${formatTime(endDate)}${nextDay}`
    } catch (error) {
      return startTime
    }
  }

  const getValidStartTimes = (duration: number) => {
    const allStartTimes = getStartTimeOptions()
    
    // For 24/7 support, we allow all start times
    // The end time can go into the next day if needed
    return allStartTimes
  }

  const getDayOptions = () => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
${Object.entries(studyPlan.weeklySchedule).map(([day, schedule]) => `
${day.toUpperCase()}:
${schedule.subjects.map(subject => 
  `  • ${subject.subject} (${subject.duration}h) - ${subject.timeSlot}
    Focus: ${subject.focus}
    Priority: ${subject.priority}`
).join('\n')}
Total Hours: ${schedule.totalHours}h
`).join('\n')}

REVISION SCHEDULE:
${studyPlan.revisionSchedule.map(item => 
  `• ${item.date} - ${item.subject} (${item.duration}h)
  Topics: ${item.topics.join(', ')}`
).join('\n')}

LEARNING TIPS:
${studyPlan.learningTips.map((tip, index) => `${index + 1}. ${tip}`).join('\n')}

EXAM STRATEGY:
${studyPlan.examStrategy.map((strategy, index) => `${index + 1}. ${strategy}`).join('\n')}

FLASHCARDS:
${studyPlan.flashcards.map((card, index) => 
  `${index + 1}. [${card.subject}] ${card.question}
   Answer: ${card.answer}
   Difficulty: ${card.difficulty}`
).join('\n')}
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
            {Object.entries(studyPlan.weeklySchedule)
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
                      const isEditing = editingSession?.day === day && editingSession?.index === index
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-xl transition-all duration-500 ease-in-out overflow-hidden ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 shadow-sm' 
                              : isEditing
                                ? 'bg-gradient-to-r from-studypal-blue/10 to-studypal-cyan/10 border-2 border-studypal-blue/30 shadow-lg transform scale-[1.02]'
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-studypal-blue/5 hover:to-studypal-cyan/5 border border-gray-200 hover:border-studypal-blue/20 hover:shadow-md hover:scale-[1.01]'
                          }`}
                        >
                          <div className={`${isEditing ? 'block space-y-6' : 'flex items-center gap-3 flex-1'}`}>
                            {/* Completion Toggle */}
                            {!isEditing && (
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
                            )}
                            
                            <div className="flex-1">
                              {isEditing ? (
                                <div className="space-y-4 p-5 bg-gradient-to-br from-white via-studypal-blue/5 to-studypal-cyan/10 rounded-xl border-2 border-studypal-blue/20 shadow-inner animate-in slide-in-from-top-2 duration-500 ease-out">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen className="h-5 w-5 text-studypal-blue" />
                                      <span className="text-sm font-bold text-studypal-blue uppercase tracking-wider">Subject & Focus</span>
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-studypal-gray-700 mb-1 uppercase tracking-wide">Subject Name</label>
                                        <input
                                          type="text"
                                          value={editingSession.tempData.subject}
                                          onChange={(e) => updateEditingField('subject', e.target.value)}
                                          className="w-full font-medium bg-white border-2 border-studypal-blue/30 focus:border-studypal-blue focus:ring-2 focus:ring-studypal-blue/20 rounded-lg px-4 py-3 text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                                          placeholder="e.g., Mathematics, Physics, Chemistry"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-studypal-gray-700 mb-1 uppercase tracking-wide">Focus Area</label>
                                        <input
                                          type="text"
                                          value={editingSession.tempData.focus}
                                          onChange={(e) => updateEditingField('focus', e.target.value)}
                                          className="w-full text-sm bg-white border-2 border-studypal-blue/30 focus:border-studypal-blue focus:ring-2 focus:ring-studypal-blue/20 rounded-lg px-4 py-3 transition-all duration-200 shadow-sm hover:shadow-md"
                                          placeholder="e.g., Quadratic equations, Organic chemistry, Newton's laws"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                      {subject.subject}
                                    </span>
                                    <Badge 
                                      variant={subject.priority === 'high' ? 'destructive' : subject.priority === 'medium' ? 'default' : 'secondary'}
                                    >
                                      {subject.priority}
                                    </Badge>
                                  </div>
                                  <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                    {subject.focus}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {!isEditing && (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span className={isCompleted ? 'line-through' : ''}>
                                  {subject.timeSlot}
                                </span>
                              </div>
                              <div className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                {subject.duration}h
                              </div>
                            </div>
                          )}

                          {isEditing && (
                            <div className="w-full">
                              <div className="space-y-4 p-5 bg-gradient-to-br from-white via-studypal-blue/5 to-studypal-cyan/10 rounded-xl border-2 border-studypal-blue/20 shadow-inner animate-in slide-in-from-bottom-2 duration-500 ease-out delay-150">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="h-5 w-5 text-studypal-blue" />
                                  <span className="text-sm font-bold text-studypal-blue uppercase tracking-wider">Schedule Details</span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-studypal-gray-700 mb-2 uppercase tracking-wide">Day of Week</label>
                                    <select
                                      value={editingSession.tempData.day}
                                      onChange={(e) => updateEditingField('day', e.target.value)}
                                      className="w-full text-sm bg-white border-2 border-studypal-blue/30 focus:border-studypal-blue focus:ring-2 focus:ring-studypal-blue/20 rounded-lg px-4 py-3 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                    >
                                      {getDayOptions().map(day => (
                                        <option key={day} value={day}>{day}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-semibold text-studypal-gray-700 mb-2 uppercase tracking-wide">Start Time</label>
                                    <select
                                      value={editingSession.tempData.startTime}
                                      onChange={(e) => updateEditingField('startTime', e.target.value)}
                                      className="w-full text-sm bg-white border-2 border-studypal-blue/30 focus:border-studypal-blue focus:ring-2 focus:ring-studypal-blue/20 rounded-lg px-4 py-3 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                    >
                                      {getValidStartTimes(editingSession.tempData.duration).map(time => (
                                        <option key={time} value={time}>{time}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-semibold text-studypal-gray-700 mb-2 uppercase tracking-wide">Calculated Time Slot</label>
                                    <div className="w-full text-sm bg-studypal-blue/10 border-2 border-studypal-blue/20 rounded-lg px-4 py-3 font-medium text-studypal-blue">
                                      {calculateEndTime(editingSession.tempData.startTime, editingSession.tempData.duration)}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-semibold text-studypal-gray-700 mb-2 uppercase tracking-wide">Study Duration</label>
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="number"
                                        value={editingSession.tempData.duration}
                                        onChange={(e) => updateEditingField('duration', parseFloat(e.target.value))}
                                        className="text-sm bg-white border-2 border-studypal-blue/30 focus:border-studypal-blue focus:ring-2 focus:ring-studypal-blue/20 rounded-lg px-4 py-3 w-24 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-center"
                                        min="0.5"
                                        max="8"
                                        step="0.5"
                                      />
                                      <span className="text-sm font-semibold text-studypal-gray-600 bg-studypal-blue/10 px-3 py-2 rounded-lg">hours</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Edit Controls */}
                          <div className={`flex items-center gap-3 transition-all duration-300 ${isEditing ? 'mt-6 pt-4 border-t border-studypal-blue/20' : 'mt-3'}`}>
                            {isEditing ? (
                              <div className="flex items-center gap-3 w-full animate-in fade-in duration-500 delay-300">
                                <button
                                  onClick={() => saveEditedSession()}
                                  disabled={isSaving || isCanceling}
                                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 shadow-md text-sm font-bold uppercase tracking-wide flex-1 justify-center transform ${
                                    isSaving 
                                      ? 'bg-gradient-to-r from-green-400 to-green-500 text-white scale-95 cursor-not-allowed' 
                                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:scale-105 hover:shadow-lg'
                                  }`}
                                  title="Save changes"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4" />
                                      Save Changes
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditingSession}
                                  disabled={isSaving || isCanceling}
                                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 shadow-md text-sm font-bold uppercase tracking-wide transform ${
                                    isCanceling 
                                      ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 scale-95 cursor-not-allowed' 
                                      : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:scale-105 hover:shadow-lg'
                                  }`}
                                  title="Cancel editing"
                                >
                                  {isCanceling ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Canceling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="animate-in fade-in duration-300">
                                <button
                                  onClick={() => startEditingSession(day, index, subject)}
                                  className="flex items-center gap-2 px-4 py-2 text-studypal-blue hover:text-white hover:bg-gradient-to-r hover:from-studypal-blue hover:to-studypal-cyan bg-studypal-blue/10 hover:bg-studypal-blue/20 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md text-xs font-semibold uppercase tracking-wide"
                                title="Edit session"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit Session
                              </button>
                              </div>
                            )}
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
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revision Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Revision Schedule
          </CardTitle>
          <CardDescription>Planned revision sessions leading up to your exam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studyPlan.revisionSchedule && Array.isArray(studyPlan.revisionSchedule) ? studyPlan.revisionSchedule.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.subject}</span>
                    <Badge variant="outline">{item.duration}h</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Topics: {item.topics.join(', ')}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(new Date(item.date))}
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-sm">No revision schedule available</div>
            )}
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
                  <span>{confirmDialog.subject.duration}h duration</span>
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

      {/* Edit Conflict Warning Dialog */}
      <Dialog open={editConflictDialog.isOpen} onOpenChange={(open) => !open && setEditConflictDialog({ isOpen: false, conflicts: [], sessionData: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Target className="h-5 w-5" />
              Schedule Conflict Detected
            </DialogTitle>
            <DialogDescription>
              The time slot you selected conflicts with existing study sessions. Would you like to save anyway or choose a different time?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Show the edited session details */}
            {editConflictDialog.sessionData && (
              <div className="bg-gradient-to-r from-studypal-blue/10 to-studypal-cyan/10 rounded-lg p-4 border border-studypal-blue/20">
                <h4 className="font-semibold text-studypal-blue mb-2">Your Changes:</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Subject:</span> {editConflictDialog.sessionData.subject}</div>
                  <div><span className="font-medium">Time:</span> {editConflictDialog.sessionData.timeSlot}</div>
                  <div><span className="font-medium">Duration:</span> {editConflictDialog.sessionData.duration}h</div>
                </div>
              </div>
            )}

            {/* Show conflicts */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conflicting Sessions:
              </h4>
              <div className="space-y-2">
                {editConflictDialog.conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-orange-700 bg-orange-100 rounded px-3 py-2">
                    📅 {conflict}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">What would you like to do?</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <span className="font-medium">Save Anyway:</span>
                  <span>Keep your changes and create overlapping sessions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">Edit Again:</span>
                  <span>Choose a different time slot to avoid conflicts</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              onClick={() => setEditConflictDialog({ isOpen: false, conflicts: [], sessionData: null })}
              className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Edit Again
            </Button>
            <Button 
              onClick={() => saveEditedSession(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Save Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}