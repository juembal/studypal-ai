'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import StudyPlanForm from '@/components/StudyPlanForm'
import StudyPlanDisplay from '@/components/StudyPlanDisplay'
import { StudyPlan, StudyPlanRequest } from '@/lib/types'
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
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showPlanCard, setShowPlanCard] = useState(false)
  const [isViewingPlan, setIsViewingPlan] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean
    conflicts: ScheduleConflict[]
    formData?: StudyPlanRequest
    generatedPlan?: StudyPlan
  }>({
    isOpen: false,
    conflicts: [],
    formData: undefined,
    generatedPlan: undefined
  })

  // Function to handle streaming study plan generation
  const generateStudyPlanWithProgress = async (requestData: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource('/api/generate-plan-stream')
      
      // Send the request data via POST (we need to modify this approach)
      fetch('/api/generate-plan-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader!.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    
                    if (data.type === 'progress') {
                      setProgressMessage(data.message) // Show progress message
                      setIsRetrying(true) // Show retry state
                    } else if (data.type === 'success') {
                      setProgressMessage(null) // Clear progress message
                      setIsRetrying(false) // Clear retry state
                      resolve(data.data) // Return the study plan
                      return
                    } else if (data.type === 'error') {
                      setProgressMessage(null) // Clear progress message
                      setIsRetrying(false) // Clear retry state
                      reject(new Error(data.message))
                      return
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', line)
                  }
                }
              }
            }
          } catch (error) {
            reject(error)
          }
        }
        
        readStream()
      }).catch(reject)
    })
  }

  const handleFormSubmitAndView = async (formData: StudyPlanRequest) => {
    console.log('=== handleFormSubmitAndView called ===')
    console.log('Form data:', formData)
    console.log('Is loading before:', isLoading)
    
    // Track request time for debugging but don't block requests
    const now = Date.now()
    setLastRequestTime(now)
    setIsLoading(true)
    setError(null)
    setProgressMessage(null)
    setIsRetrying(false)
    console.log('Set loading to true, error to null')
    
    // Auto-scroll to top when generation starts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    try {
      // Check existing plans first
      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      console.log('Existing plans in localStorage:', existingPlans)
      console.log('Number of existing plans:', existingPlans.length)
      
      // Generate study plan with existing schedule context
      const existingScheduleContext = ScheduleManager.generateExistingScheduleContext()
      console.log('Existing schedule context:', existingScheduleContext)
      
      console.log('About to make streaming API call to /api/generate-plan-stream')
      console.log('Request payload:', { ...formData, existingScheduleContext })
      
      // Use streaming API for real-time progress updates
      const plan = await generateStudyPlanWithProgress({ ...formData, existingScheduleContext })
      console.log('Generated plan received:', plan)
      
      // Check if fallback was used and show appropriate message
      if (plan.generatedBy === 'fallback' || plan.id?.includes('fallback')) {
        console.log('Fallback system was used')
        setError('✨ AI was busy, so we generated your study plan using our smart fallback system! Your plan is ready.')
        setTimeout(() => setError(null), 5000) // Clear message after 5 seconds
      } else if (plan.generatedBy === 'emergency-fallback') {
        console.log('Emergency fallback was used')
        setError('⚡ Generated using our emergency backup system. Your study plan is ready!')
        setTimeout(() => setError(null), 5000)
      }
      
      // Check for schedule conflicts
      console.log('About to check for conflicts with plan:', plan)
      console.log('ScheduleManager available:', !!ScheduleManager)
      console.log('detectConflicts method available:', !!ScheduleManager.detectConflicts)
      
      const conflicts = ScheduleManager.detectConflicts(plan)
      console.log('Conflicts detected:', conflicts)
      console.log('Conflict dialog current state:', conflictDialog)
      
      if (conflicts.length > 0) {
        console.log(`Found ${conflicts.length} schedule conflicts:`, conflicts)
        console.log('Setting conflict dialog to open...')
        
        // Show notice about regeneration timing
        setError('⚠️ Schedule conflicts detected! If you choose to regenerate, it may take longer because the AI was just used to generate your plan.')
        
        setConflictDialog({
          isOpen: true,
          conflicts,
          formData,
          generatedPlan: plan
        })
        setIsLoading(false)
        console.log('Conflict dialog should now be open')
        console.log('New conflict dialog state will be:', {
          isOpen: true,
          conflicts,
          formData,
          generatedPlan: plan
        })
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

      const savedPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      
      // Check for duplicates based on subjects, target date, and creation time (within 5 seconds)
      const isDuplicate = savedPlans.some((existingPlan: any) => {
        const timeDiff = Math.abs(new Date(planToSave.createdAt).getTime() - new Date(existingPlan.createdAt).getTime())
        return (
          JSON.stringify(existingPlan.subjects.sort()) === JSON.stringify(planToSave.subjects.sort()) &&
          existingPlan.targetDate === planToSave.targetDate &&
          timeDiff < 5000 // Within 5 seconds
        )
      })
      
      if (!isDuplicate) {
        const updatedPlans = [planToSave, ...savedPlans]
        localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
      }

      setStudyPlan(plan)
      setShowPlanCard(true)
    } catch (error: any) {
      console.error('=== ERROR in handleFormSubmitAndView ===')
      console.error('Full error object:', error)
      console.error('Error message:', error.message)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      console.error('Error response status:', error.response?.status)
      console.error('Error generating study plan:', error)
      
      // Handle any remaining errors (streaming should handle rate limits automatically)
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        setError('⚠️ API is currently busy. The system will automatically retry with smart fallback.')
      }
      
      setError(error.response?.data?.error || 'Failed to generate study plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverwriteExistingPlans = async () => {
    const lastFormData = conflictDialog.formData
    const plan = conflictDialog.generatedPlan
    const conflicts = conflictDialog.conflicts
    
    if (!lastFormData || !plan) {
      setError('No plan data available to save')
      return
    }

    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined, generatedPlan: undefined })
    setIsLoading(true)
    
    try {
      console.log('Overwriting existing plans with new plan that has conflicts...')
      console.log('Conflicts being overwritten:', conflicts)

      // Remove conflicting plans from localStorage
      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const conflictingPlanIds = new Set(conflicts.map(c => c.existingPlanId))
      
      // Filter out conflicting plans
      const nonConflictingPlans = existingPlans.filter((existingPlan: any) => 
        !conflictingPlanIds.has(existingPlan.id)
      )

      // Save the new plan
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

      // Add the new plan to the non-conflicting plans
      const updatedPlans = [planToSave, ...nonConflictingPlans]
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))

      console.log(`Removed ${conflictingPlanIds.size} conflicting plans and saved new plan`)
      setStudyPlan(plan)
      setShowPlanCard(true)
    } catch (error) {
      console.error('Error saving study plan:', error)
      setError('Failed to save study plan. Please try again.')
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
    
    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined, generatedPlan: undefined })
    setIsLoading(true)
    
    // Show initial regeneration notice
    setError('🤖 Starting AI regeneration... This will take longer than usual because we just used the AI. Please be patient while we wait for the AI to be available again.')
    
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
      let plan
      
      // Retry AI generation with increasing delays
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount === 0) {
            setError('⏳ Regenerating with AI... This may take longer because the AI was just used to generate your previous plan. Please wait while we create a conflict-free version.')
          } else {
            setError(`⏳ AI is busy from recent usage, retrying in ${(retryCount * 15)} seconds... (Attempt ${retryCount + 1}/${maxRetries + 1})`)
          }
          
          // Progressive delay: 2s, 15s, 30s, 45s
          const delay = retryCount === 0 ? 2000 : retryCount * 15000
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const estimatedSeconds = (retryCount + 1) * 15 + 10 // Progressive timing: 25s, 40s, 55s, 70s
          setError(`Generating AI-powered conflict-free study plan... (${estimatedSeconds} seconds)`)
          
          // Use the enhanced streaming endpoint for conflict-free regeneration
          const response = await axios.post('/api/generate-plan', { 
            ...lastFormData, 
            existingScheduleContext: conflictFreeInstructions,
            regenerateAttempt: true,
            availableTimeSlots: availableTimeSlots,
            // Ensure all original form data is preserved
            specificTopics: lastFormData.specificTopics,
            subjects: lastFormData.subjects,
            dailyHours: lastFormData.dailyHours,
            studyLevel: lastFormData.studyLevel,
            goals: lastFormData.goals,
            learningStyle: lastFormData.learningStyle,
            difficulty: lastFormData.difficulty,
            currentKnowledge: lastFormData.currentKnowledge,
            preferences: lastFormData.preferences,
            includeWeekends: lastFormData.includeWeekends,
            preferredTimes: lastFormData.preferredTimes,
            targetDate: lastFormData.targetDate
          })
          plan = response.data
          console.log('Received plan from AI on attempt', retryCount + 1, ':', plan)
          setError(null) // Clear success message
          break // Success, exit retry loop
          
        } catch (apiError: any) {
          console.log(`API call failed on attempt ${retryCount + 1}:`, apiError.response?.data || apiError.message)
          
          // Check if it's a rate limit error
          const isRateLimit = apiError.response?.status === 429 || 
                             apiError.response?.data?.isRateLimit ||
                             apiError.message?.includes('Rate limit') ||
                             apiError.response?.data?.error?.includes('Rate limit')
          
          if (isRateLimit && retryCount < maxRetries) {
            console.log(`Rate limit detected, will retry in ${(retryCount + 1) * 15} seconds...`)
            retryCount++
            continue // Try again with longer delay
          } else if (isRateLimit && retryCount >= maxRetries) {
            // Only after all retries failed
            setError('AI is currently overloaded. Please try again in a few minutes, or create a new study plan instead.')
            setIsLoading(false)
            return
          } else {
            // Re-throw the error if it's not a rate limit issue
            throw apiError
          }
        }
      }

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
        
        // Check for duplicates
        const isDuplicate = existingPlans.some((existingPlan: any) => {
          const timeDiff = Math.abs(new Date(planToSave.createdAt).getTime() - new Date(existingPlan.createdAt).getTime())
          return (
            JSON.stringify(existingPlan.subjects.sort()) === JSON.stringify(planToSave.subjects.sort()) &&
            existingPlan.targetDate === planToSave.targetDate &&
            timeDiff < 5000
          )
        })
        
        if (!isDuplicate) {
          const updatedPlans = [planToSave, ...existingPlans]
          localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
        }

        // Convert partial plan to complete StudyPlan
        const completePlan: StudyPlan = {
          id: Date.now().toString(),
          name: `Study Plan for ${lastFormData.subjects.join(', ')}`,
          subjects: lastFormData.subjects,
          studyLevel: lastFormData.studyLevel,
          totalHours: lastFormData.dailyHours * 7, // Estimate weekly hours
          dailyHours: lastFormData.dailyHours,
          startDate: new Date().toISOString().split('T')[0],
          targetDate: lastFormData.targetDate,
          goals: lastFormData.goals,
          sessions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...manualPlan
        }
        setStudyPlan(completePlan)
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
      
      // Check for duplicates
      const isDuplicate = existingPlans.some((existingPlan: any) => {
        const timeDiff = Math.abs(new Date(planToSave.createdAt).getTime() - new Date(existingPlan.createdAt).getTime())
        return (
          JSON.stringify(existingPlan.subjects.sort()) === JSON.stringify(planToSave.subjects.sort()) &&
          existingPlan.targetDate === planToSave.targetDate &&
          timeDiff < 5000
        )
      })
      
      if (!isDuplicate) {
        const updatedPlans = [planToSave, ...existingPlans]
        localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
      }

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
    setConflictDialog({ isOpen: false, conflicts: [], formData: undefined, generatedPlan: undefined })
    setIsLoading(false)
    setError(null)
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

      {/* Progress Notification - Shows retry status */}
      {progressMessage && isRetrying && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <p className="text-blue-800 font-semibold text-lg">{progressMessage}</p>
                <p className="text-blue-600 text-sm mt-1">Please wait while we handle the API rate limit...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !isRetrying && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

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
                      <span className="ml-2 font-medium text-base">
                        {studyPlan.weeklySchedule ? 
                          [...new Set(Object.values(studyPlan.weeklySchedule).flatMap(day => day.subjects?.map(s => s.subject) || []))].length : 
                          studyPlan.sessions ? 
                            [...new Set(studyPlan.sessions.map(s => s.subject))].length :
                            studyPlan.subjects?.length || 0
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Weekly Hours:</span>
                      <span className="ml-2 font-medium text-base">
                        {studyPlan.weeklySchedule ? 
                          Object.values(studyPlan.weeklySchedule).reduce((acc, day) => acc + (day.totalHours || 0), 0) : 
                          studyPlan.sessions ? 
                            studyPlan.sessions.reduce((acc, session) => acc + (session.duration || 0), 0) :
                            studyPlan.totalHours || 0
                        }h
                      </span>
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