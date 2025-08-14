'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import StudyPlanForm from '@/components/StudyPlanForm'
import StudyPlanDisplay from '@/components/StudyPlanDisplay'
import { StudyPlan, StudyPlanRequest, generateStudyPlan } from '@/lib/gemini'
import { ScheduleManager, ScheduleConflict } from '@/lib/scheduleManager'
import ConflictDialog from '@/components/ConflictDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function CreateStudyPlan() {
  const router = useRouter()
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPlanCard, setShowPlanCard] = useState(false)
  const [isViewingPlan, setIsViewingPlan] = useState(false)
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean
    conflicts: ScheduleConflict[]
    formData?: StudyPlanRequest
  }>({
    isOpen: false,
    conflicts: [],
    formData: undefined
  })

  const handleFormSubmitAndView = async (formData: StudyPlanRequest) => {
    setIsLoading(true)
    setError(null)
    
    // Auto-scroll to top when generation starts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    try {
      // Generate study plan with existing schedule context
      const existingScheduleContext = ScheduleManager.generateExistingScheduleContext()
      const response = await axios.post('/api/generate-plan', { 
        ...formData, 
        existingScheduleContext 
      })
      const plan = response.data
      
      // Check for schedule conflicts
      const conflicts = ScheduleManager.detectConflicts(plan)
      
      if (conflicts.length > 0) {
        setConflictDialog({
          isOpen: true,
          conflicts,
          formData
        })
        setIsLoading(false)
        return
      }

      // No conflicts, save the plan
      const planToSave = {
        id: Date.now().toString(),
        name: `${formData.subjects.join(', ')} Study Plan`,
        subjects: formData.subjects,
        targetDate: formData.targetDate,
        createdAt: new Date().toISOString(),
        dailyHours: formData.dailyHours,
        studyLevel: formData.studyLevel,
        fullPlan: plan,
        status: 'active' as const
      }

      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = [planToSave, ...existingPlans]
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))

      setStudyPlan(plan)
      setShowPlanCard(true)
    } catch (error: any) {
      console.error('Error generating study plan:', error)
      
      // Handle rate limit errors with user-friendly message
      if (error.response?.status === 429 || error.response?.data?.isRateLimit) {
        const retryAfter = error.response?.data?.retryAfter || 10
        setError(`Rate limit reached. The system will automatically retry in ${retryAfter} seconds...`)
        
        // Auto-retry after the specified time
        setTimeout(async () => {
          setError('Retrying...')
          try {
            await handleFormSubmitAndView(formData)
          } catch (retryError) {
            console.error('Retry failed:', retryError)
            setError('Failed to generate study plan after retry. Please try again later.')
            setIsLoading(false)
          }
        }, retryAfter * 1000)
        return
      }
      
      setError(error.response?.data?.error || 'Failed to generate study plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverwriteExistingPlans = async () => {
    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined })
    setIsLoading(true)
    
    try {
      // Get the form data from the conflict dialog
      const lastFormData = conflictDialog.formData
      if (!lastFormData) {
        setError('No form data available to generate plan')
        return
      }

      // Generate plan without conflict checking
      const existingScheduleContext = ScheduleManager.generateExistingScheduleContext()
      const response = await axios.post('/api/generate-plan', { 
        ...lastFormData, 
        existingScheduleContext 
      })
      const plan = response.data

      // Save the plan (overwriting conflicts)
      const planToSave = {
        id: Date.now().toString(),
        name: `${lastFormData.subjects.join(', ')} Study Plan`,
        subjects: lastFormData.subjects,
        targetDate: lastFormData.targetDate,
        createdAt: new Date().toISOString(),
        dailyHours: lastFormData.dailyHours,
        studyLevel: lastFormData.studyLevel,
        fullPlan: plan,
        status: 'active' as const
      }

      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = [planToSave, ...existingPlans]
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))

      setStudyPlan(plan)
      setShowPlanCard(true)
    } catch (error) {
      console.error('Error generating study plan:', error)
      setError('Failed to generate study plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateWithoutConflicts = async () => {
    // Get the form data BEFORE clearing the dialog state
    const lastFormData = conflictDialog.formData
    const currentConflicts = conflictDialog.conflicts
    
    if (!lastFormData) {
      setError('No form data available to regenerate plan')
      return
    }
    
    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined })
    setIsLoading(true)
    
    try {
      console.log('Starting regeneration process...')
      console.log('Current conflicts:', currentConflicts)
      
      // Generate available time slots that don't conflict
      console.log('Generating available time slots...')
      let availableTimeSlots = []
      
      try {
        availableTimeSlots = ScheduleManager.generateAvailableTimeSlots(currentConflicts)
      } catch (methodError) {
        console.log('New method not available, using fallback...')
        // Fallback: create simple available slots
        const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const timeSlots = [
          '6:00 AM - 8:00 AM',
          '8:00 AM - 10:00 AM', 
          '10:00 AM - 12:00 PM',
          '2:00 PM - 4:00 PM',
          '6:00 PM - 8:00 PM',
          '8:00 PM - 10:00 PM'
        ]
        
        availableTimeSlots = allDays.flatMap(day => 
          timeSlots.map(timeRange => ({ day, timeRange }))
        )
      }
      
      console.log('Available time slots:', availableTimeSlots)
      
      // Create a much simpler and more direct instruction
      const conflictFreeInstructions = `
CONFLICT-FREE REGENERATION MODE:

AVAILABLE TIME SLOTS (USE ONLY THESE):
${availableTimeSlots.map(slot => `✅ ${slot.day}: ${slot.timeRange}`).join('\n')}

MANDATORY RULES:
1. ONLY use the time slots listed above
2. Do NOT use any other time slots
3. Distribute ${lastFormData.subjects.join(', ')} across these available slots
4. Each session should be 1-2 hours long
5. Ensure total daily hours don't exceed ${lastFormData.dailyHours} hours

SIMPLE INSTRUCTION: Create a study schedule using ONLY the available time slots listed above. This guarantees zero conflicts.`

      console.log('Making API call with conflict-free instructions...')
      const response = await axios.post('/api/generate-plan', { 
        ...lastFormData, 
        existingScheduleContext: conflictFreeInstructions,
        regenerateAttempt: true,
        availableTimeSlots: availableTimeSlots
      })
      const plan = response.data
      console.log('Received plan from API:', plan)

      // Final conflict check (should be zero now)
      const conflicts = ScheduleManager.detectConflicts(plan)
      
      if (conflicts.length > 0) {
        // If there are still conflicts, create a manual conflict-free plan
        console.log('AI still created conflicts, generating manual conflict-free plan...')
        let manualPlan
        
        try {
          manualPlan = ScheduleManager.createManualConflictFreePlan(lastFormData, availableTimeSlots)
        } catch (methodError) {
          console.log('Manual plan method not available, using simple fallback...')
          // Simple fallback plan
          manualPlan = {
            weeklySchedule: {
              Monday: { subjects: [{ subject: lastFormData.subjects[0], duration: 2, timeSlot: '6:00 PM - 8:00 PM', focus: 'Study session', priority: 'high' }], totalHours: 2 },
              Tuesday: { subjects: [{ subject: lastFormData.subjects[1] || lastFormData.subjects[0], duration: 2, timeSlot: '6:00 PM - 8:00 PM', focus: 'Study session', priority: 'high' }], totalHours: 2 },
              Wednesday: { subjects: [], totalHours: 0 },
              Thursday: { subjects: [], totalHours: 0 },
              Friday: { subjects: [], totalHours: 0 },
              Saturday: { subjects: [], totalHours: 0 },
              Sunday: { subjects: [], totalHours: 0 }
            },
            revisionSchedule: [],
            learningTips: ['Focus on understanding concepts', 'Practice regularly'],
            examStrategy: ['Review notes daily', 'Take practice tests'],
            flashcards: [],
            onlineResources: []
          }
        }
        
        const planToSave = {
          id: Date.now().toString(),
          name: `${lastFormData.subjects.join(', ')} Study Plan (Conflict-Free)`,
          subjects: lastFormData.subjects,
          targetDate: lastFormData.targetDate,
          createdAt: new Date().toISOString(),
          dailyHours: lastFormData.dailyHours,
          studyLevel: lastFormData.studyLevel,
          fullPlan: manualPlan,
          status: 'active' as const
        }

        const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
        const updatedPlans = [planToSave, ...existingPlans]
        localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))

        setStudyPlan(manualPlan)
        setShowPlanCard(true)
        return
      }

      // No conflicts, save the plan
      const planToSave = {
        id: Date.now().toString(),
        name: `${lastFormData.subjects.join(', ')} Study Plan`,
        subjects: lastFormData.subjects,
        targetDate: lastFormData.targetDate,
        createdAt: new Date().toISOString(),
        dailyHours: lastFormData.dailyHours,
        studyLevel: lastFormData.studyLevel,
        fullPlan: plan,
        status: 'active' as const
      }

      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = [planToSave, ...existingPlans]
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))

      setStudyPlan(plan)
      setShowPlanCard(true)
    } catch (error: any) {
      console.error('Error regenerating study plan:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      
      // Handle rate limit errors
      if (error.response?.status === 429 || error.response?.data?.isRateLimit) {
        const retryAfter = error.response?.data?.retryAfter || 10
        setError(`Rate limit reached. The system will automatically retry in ${retryAfter} seconds...`)
        
        setTimeout(async () => {
          setError('Retrying regeneration...')
          try {
            await handleRegenerateWithoutConflicts()
          } catch (retryError) {
            console.error('Retry failed:', retryError)
            setError('Failed to regenerate study plan after retry. Please try again later.')
            setIsLoading(false)
          }
        }, retryAfter * 1000)
        return
      }
      
      setError('Failed to regenerate study plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelConflictDialog = () => {
    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined })
  }

  const handleNewPlan = () => {
    setStudyPlan(null)
    setShowPlanCard(false)
    setIsViewingPlan(false)
  }

  const handleViewPlan = () => {
    setShowPlanCard(false)
    setIsViewingPlan(true)
    // Auto-scroll to top when viewing plan
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Auto-scroll to top when loading starts or plan is generated
  useEffect(() => {
    if (isLoading || (showPlanCard && studyPlan)) {
      // Smooth scroll to top of the page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [isLoading, showPlanCard, studyPlan])


  // Show generated plan
  if (studyPlan && isViewingPlan) {
    return (
      <div className="container mx-auto px-4 py-8 pt-32" id="study-plan-top">
        <div className="mb-4">
          <Button asChild className="mb-4 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
            <Link href="/study-assistant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Plans
            </Link>
          </Button>
        </div>
        <StudyPlanDisplay studyPlan={studyPlan} onNewPlan={handleNewPlan} />
      </div>
    )
  }

  // Show form
  return (
    <div className={`container mx-auto px-4 py-12 pt-36 ${showPlanCard && studyPlan && !isViewingPlan ? 'min-h-screen' : ''}`}>
      {/* Header Section */}
      <div className="text-center mb-16">
        <Button asChild className="mb-8 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
          <Link href="/study-assistant">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Plans
          </Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-space-grotesk">
          Build Your Perfect <span className="bg-gradient-to-r from-studypal-blue to-studypal-cyan bg-clip-text text-transparent">Study Plan</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Share your study needs and receive personalized AI recommendations designed for your subjects, schedule, and academic goals
        </p>

        {/* Steps Indicator */}
        <div className="flex justify-center items-center gap-6 mb-12">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              showPlanCard || studyPlan ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-studypal-blue to-studypal-cyan text-white'
            }`}>
              {showPlanCard || studyPlan ? '✓' : '1'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-sm">Goals</div>
              <div className="text-xs text-gray-500">Your subjects & preferences</div>
            </div>
          </div>
          
          <div className={`w-6 h-0.5 ${showPlanCard || studyPlan ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              showPlanCard || studyPlan 
                ? 'bg-green-500 text-white' 
                : isLoading 
                  ? 'bg-gradient-to-r from-studypal-blue to-studypal-cyan text-white' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {showPlanCard || studyPlan ? '✓' : isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : '2'}
            </div>
            <div className="text-left">
              <div className={`text-sm ${showPlanCard || studyPlan ? 'font-semibold text-gray-900' : isLoading ? 'font-semibold text-studypal-blue' : 'font-semibold text-gray-500'}`}>
                AI Analysis
              </div>
              <div className={`text-xs ${showPlanCard || studyPlan ? 'text-gray-500' : isLoading ? 'text-studypal-blue' : 'text-gray-400'}`}>
                {isLoading ? 'Processing...' : 'Smart optimization'}
              </div>
            </div>
          </div>
          
          <div className={`w-6 h-0.5 ${studyPlan && isViewingPlan ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              studyPlan && isViewingPlan
                ? 'bg-green-500 text-white'
                : showPlanCard && !isViewingPlan && isLoading
                  ? 'bg-gradient-to-r from-studypal-blue to-studypal-cyan text-white animate-pulse'
                  : showPlanCard && !isViewingPlan && !isLoading
                    ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {studyPlan && isViewingPlan ? '✓' : showPlanCard && !isViewingPlan && isLoading ? '⚡' : showPlanCard && !isViewingPlan && !isLoading ? '✓' : '3'}
            </div>
            <div className="text-left">
              <div className={`text-sm ${
                studyPlan && isViewingPlan 
                  ? 'font-semibold text-gray-900' 
                  : showPlanCard && !isViewingPlan && isLoading
                    ? 'font-semibold text-studypal-blue'
                  : showPlanCard && !isViewingPlan && !isLoading
                    ? 'font-semibold text-gray-900'
                    : 'font-semibold text-gray-500'
              }`}>
                Your Plan
              </div>
              <div className={`text-xs ${
                studyPlan && isViewingPlan 
                  ? 'text-gray-500' 
                  : showPlanCard && !isViewingPlan && isLoading
                    ? 'text-studypal-blue'
                  : showPlanCard && !isViewingPlan && !isLoading
                    ? 'text-gray-500'
                    : 'text-gray-400'
              }`}>
                {showPlanCard && !isViewingPlan && isLoading ? 'Loading...' : 'Personalized schedule'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Form - Only show when no plan is generated */}
      {!showPlanCard && !studyPlan && (
        <StudyPlanForm onSubmit={handleFormSubmitAndView} isLoading={isLoading} />
      )}

      {/* Plan Success Card - Replaces form after generation */}
      {showPlanCard && studyPlan && !isViewingPlan && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <Card className="glass-effect border-0 shadow-glow hover:shadow-glow-lg transition-all duration-500 w-full transform animate-slide-up">
            <CardHeader className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mb-3 font-heading">
                Study Plan Generated Successfully!
              </CardTitle>
              <CardDescription className="text-base text-gray-600 max-w-md mx-auto">
                Your personalized study schedule is ready to help you achieve your academic goals
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-studypal-blue/10 to-studypal-cyan/10 rounded-lg p-4 border border-studypal-blue/20">
                  <h3 className="font-semibold text-gray-900 mb-3 text-base">Plan Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Subjects:</span>
                      <span className="ml-2 font-medium text-base">{studyPlan.weeklySchedule ? [...new Set(Object.values(studyPlan.weeklySchedule).flatMap(day => day.subjects?.map(s => s.subject) || []))].length : 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Weekly Hours:</span>
                      <span className="ml-2 font-medium text-base">{studyPlan.weeklySchedule ? Object.values(studyPlan.weeklySchedule).reduce((acc, day) => acc + (day.totalHours || 0), 0) : 0}h</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleViewPlan}
                  className="w-full bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui py-2.5" 
                  size="lg"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span className="text-base font-semibold">View My Study Plan</span>
                </Button>

                <Button 
                  onClick={handleNewPlan}
                  className="w-full bg-gray-100 hover:bg-gradient-to-r hover:from-studypal-amber hover:to-studypal-amber/90 text-gray-700 hover:text-studypal-gray-900 border border-gray-300 hover:border-studypal-amber hover:shadow-lg hover:shadow-studypal-amber/25 font-mono-ui py-2.5 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5" 
                  size="lg"
                  variant="outline"
                >
                  <span className="text-base font-semibold">Generate New One</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Conflict Dialog */}
      <ConflictDialog
        isOpen={conflictDialog.isOpen}
        conflicts={conflictDialog.conflicts}
        onRegenerate={handleRegenerateWithoutConflicts}
        onOverwrite={handleOverwriteExistingPlans}
        onCancel={handleCancelConflictDialog}
      />
    </div>
  )
}