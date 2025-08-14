'use client'

import { useState, useEffect } from 'react'
import StudyPlanDisplay from '@/components/StudyPlanDisplay'
import { StudyPlan } from '@/lib/gemini'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, BookOpen, MoreVertical, CheckCircle, Edit, Trash2, Target, Brain, Zap, TrendingUp, Star, Users, Award, Lightbulb, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface StoredStudyPlan {
  id: string
  name: string
  subjects: string[]
  targetDate: string
  createdAt: string
  dailyHours: number
  studyLevel: string
  fullPlan?: StudyPlan
  status?: 'active' | 'completed' | 'paused'
  completedAt?: string
}

export default function StudyAssistant() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [savedPlans, setSavedPlans] = useState<StoredStudyPlan[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    planId: string | null
    planName: string
  }>({
    isOpen: false,
    planId: null,
    planName: ''
  })

  useEffect(() => {
    loadSavedPlans()
    
    // Check if we're viewing a specific plan from dashboard
    const currentPlan = sessionStorage.getItem('currentStudyPlan')
    if (currentPlan) {
      try {
        const plan = JSON.parse(currentPlan)
        setStudyPlan(plan)
        // Clear the session storage after loading
        sessionStorage.removeItem('currentStudyPlan')
        sessionStorage.removeItem('currentStudyPlanId')
      } catch (error) {
        console.error('Error loading plan from session storage:', error)
      }
    }
  }, [])

  const loadSavedPlans = () => {
    try {
      const plans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      if (Array.isArray(plans)) {
        setSavedPlans(plans)
      }
    } catch (error) {
      console.error('Error loading saved plans:', error)
    }
  }

  const calculateDaysUntil = (targetDate: string): number => {
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getPlanStatus = (plan: StoredStudyPlan): 'active' | 'completed' | 'overdue' | 'due-today' => {
    if (plan.status === 'completed') return 'completed'
    
    const daysUntil = calculateDaysUntil(plan.targetDate)
    if (daysUntil < 0) return 'overdue'
    if (daysUntil === 0) return 'due-today'
    return 'active'
  }

  const handleViewPlan = (planId: string) => {
    const plan = savedPlans.find(p => p.id === planId)
    if (plan && plan.fullPlan) {
      setStudyPlan(plan.fullPlan)
      // Auto-scroll to top when plan is selected
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }, 100) // Small delay to ensure the component has rendered
    }
  }

  const handleMarkAsCompleted = (planId: string) => {
    try {
      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = existingPlans.map((plan: StoredStudyPlan) => 
        plan.id === planId 
          ? { ...plan, status: 'completed', completedAt: new Date().toISOString() }
          : plan
      )
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
      loadSavedPlans()
    } catch (error) {
      console.error('Error updating plan status:', error)
    }
  }

  const handleMarkAsActive = (planId: string) => {
    try {
      const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const updatedPlans = existingPlans.map((plan: StoredStudyPlan) => 
        plan.id === planId 
          ? { ...plan, status: 'active', completedAt: undefined }
          : plan
      )
      localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
      loadSavedPlans()
    } catch (error) {
      console.error('Error updating plan status:', error)
    }
  }

  const openDeleteDialog = (planId: string, planName: string) => {
    setDeleteDialog({
      isOpen: true,
      planId,
      planName
    })
  }

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      planId: null,
      planName: ''
    })
  }

  const handleConfirmDelete = () => {
    if (deleteDialog.planId) {
      try {
        const existingPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
        const updatedPlans = existingPlans.filter((plan: StoredStudyPlan) => plan.id !== deleteDialog.planId)
        localStorage.setItem('studypal_plans', JSON.stringify(updatedPlans))
        loadSavedPlans()
        handleCancelDelete()
      } catch (error) {
        console.error('Error deleting plan:', error)
      }
    }
  }

  const handleNewPlan = () => {
    setStudyPlan(null)
  }

  // Show generated plan view
  if (studyPlan) {
    return (
      <div className="container mx-auto px-4 py-8 pt-32" id="study-plan-top">
        <div className="mb-4">
          <Button onClick={() => setStudyPlan(null)} className="mb-4 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Plans
          </Button>
        </div>
        <StudyPlanDisplay studyPlan={studyPlan} onNewPlan={handleNewPlan} />
      </div>
    )
  }

  // Show main overview page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 pt-36">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 font-space-grotesk">
            My <span className="text-gray-900">Study</span><span className="bg-gradient-to-r from-studypal-blue to-studypal-cyan bg-clip-text text-transparent">Pal</span> Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your personalized AI study companion. Create, manage, and track your learning journey with intelligent study plans tailored to your goals.
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-blue-100">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-cyan-100">
              <Target className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">Goal-Oriented</span>
            </div>
            <div className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-amber-100">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">Adaptive</span>
            </div>
            <div className="flex items-center gap-2 bg-white backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-green-100">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Progress Tracking</span>
            </div>
          </div>

          {/* Create New Plan Button */}
          <Button asChild size="lg" className="text-xl px-12 py-8 bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
            <Link href="/study-assistant/create">
              <Plus className="h-6 w-6 mr-3" />
              Create New Study Plan
            </Link>
          </Button>
        </div>

        {/* Saved Plans Section */}
        {savedPlans.length > 0 ? (
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-center">Your Study Plans</h2>
            <div className="grid gap-6">
              {savedPlans.map((plan) => {
                const planStatus = getPlanStatus(plan)
                const daysUntil = calculateDaysUntil(plan.targetDate)
                
                return (
                  <Card 
                    key={plan.id} 
                    className="glass-effect border-0 hover-lift hover-glow transition-all duration-300 animate-scale-in group cursor-pointer"
                    onClick={(e) => {
                      // Fallback click handler for the entire card
                      if (e.target === e.currentTarget || !e.target.closest('.dropdown-menu, .dropdown-trigger')) {
                        e.preventDefault()
                        e.stopPropagation()
                        handleViewPlan(plan.id)
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1 cursor-pointer pointer-events-auto" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewPlan(plan.id)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                        >
                          <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors duration-200 pointer-events-none select-none">{plan.name}</CardTitle>
                          <CardDescription className="text-base text-gray-600 pointer-events-none select-none">
                            {plan.subjects.join(', ')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2">
                            <Badge variant={
                              planStatus === 'completed' ? 'secondary' :
                              planStatus === 'overdue' ? 'destructive' :
                              planStatus === 'due-today' ? 'destructive' : 'default'
                            }>
                              {planStatus === 'completed' ? 'Completed' :
                               planStatus === 'overdue' ? 'Overdue' :
                               planStatus === 'due-today' ? 'Due Today' : 'Active'}
                            </Badge>
                            <Badge variant="outline">
                              {plan.studyLevel}
                            </Badge>
                          </div>
                          
                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 dropdown-trigger"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dropdown-menu">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleViewPlan(plan.id)
                                }}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                View Plan
                              </DropdownMenuItem>
                              {planStatus !== 'completed' ? (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMarkAsCompleted(plan.id)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMarkAsActive(plan.id)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Mark as Active
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openDeleteDialog(plan.id, plan.name)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Plan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Target: {new Date(plan.targetDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {plan.dailyHours}h/day
                          </span>
                        </div>
                        <div className="text-right">
                          <div>
                            {planStatus === 'completed' && plan.completedAt ? 
                              `Completed ${new Date(plan.completedAt).toLocaleDateString()}` :
                              daysUntil > 0 ? `${daysUntil} days left` : 
                              daysUntil === 0 ? 'Due today' : 
                              `${Math.abs(daysUntil)} days overdue`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(plan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : null}


        {/* Study Tips Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Study Smart, Not Hard</h2>
            <p className="text-lg text-gray-600">Proven techniques integrated into every StudyPal plan</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-effect border-0 p-6 hover-lift">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Spaced Repetition</h3>
              <p className="text-gray-600">Review material at optimal intervals to maximize long-term retention and minimize forgetting.</p>
            </Card>
            
            <Card className="glass-effect border-0 p-6 hover-lift">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Active Recall</h3>
              <p className="text-gray-600">Test yourself regularly with flashcards and practice questions to strengthen memory pathways.</p>
            </Card>
            
            <Card className="glass-effect border-0 p-6 hover-lift">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Pomodoro Technique</h3>
              <p className="text-gray-600">Break study sessions into focused 25-minute intervals with short breaks for optimal concentration.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Study Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this study plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">{deleteDialog.planName}</span>
              </div>
              <p className="text-sm text-red-700">
                This will permanently remove the study plan and all its data from your device.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={handleCancelDelete} className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}