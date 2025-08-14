'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, BookOpen, Target, TrendingUp, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StudyPlan } from '@/lib/gemini'

interface StoredStudyPlan {
  id: string
  name: string
  subjects: string[]
  targetDate: string
  createdAt: string
  dailyHours: number
  studyLevel: string
}

export default function Dashboard() {
  const router = useRouter()
  const [studyPlans, setStudyPlans] = useState<StoredStudyPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load study plans from localStorage
    const loadStudyPlans = () => {
      try {
        const stored = localStorage.getItem('studypal_plans')
        if (stored) {
          const plans = JSON.parse(stored)
          setStudyPlans(plans)
        }
      } catch (error) {
        console.error('Error loading study plans:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudyPlans()
  }, [])

  const calculateDaysUntil = (targetDate: string): number => {
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStats = () => {
    const totalPlans = studyPlans.length
    const activePlans = studyPlans.filter(plan => {
      const daysUntil = calculateDaysUntil(plan.targetDate)
      return daysUntil > 0
    }).length
    
    const totalSubjects = [...new Set(studyPlans.flatMap(plan => plan.subjects))].length
    const totalHours = studyPlans.reduce((sum, plan) => sum + plan.dailyHours, 0)

    return {
      totalPlans,
      activePlans,
      totalSubjects,
      totalHours
    }
  }

  const handleViewPlan = (planId: string) => {
    const plan = studyPlans.find(p => p.id === planId)
    if (plan && plan.fullPlan) {
      // Store the plan in sessionStorage so the study assistant can access it
      sessionStorage.setItem('currentStudyPlan', JSON.stringify(plan.fullPlan))
      sessionStorage.setItem('currentStudyPlanId', planId)
      // Navigate to study assistant page which will detect and display the plan
      router.push('/study-assistant')
    }
  }

  const stats = getStats()

  return (
    <div className="container mx-auto px-4 py-8 pt-32">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk"><span className="text-gray-900">Study</span><span className="bg-gradient-to-r from-studypal-blue to-studypal-cyan bg-clip-text text-transparent">Pal</span> Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your progress and manage your study plans</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui">
            <Link href="/study-assistant">
              <Plus className="h-4 w-4 mr-2" />
              New Study Plan
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Study Plans</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-xs text-muted-foreground">
                Plans created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePlans}</div>
              <p className="text-xs text-muted-foreground">
                Currently studying
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">
                Unique subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours}</div>
              <p className="text-xs text-muted-foreground">
                Total planned hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Study Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Study Plans
            </CardTitle>
            <CardDescription>
              Manage and track your study plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading your study plans...</p>
              </div>
            ) : studyPlans.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Study Plans Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first AI-powered study plan to get started on your learning journey.
                </p>
                <Button asChild className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui">
                  <Link href="/study-assistant">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {studyPlans.map((plan) => {
                  const daysUntil = calculateDaysUntil(plan.targetDate)
                  const isActive = daysUntil > 0
                  const isOverdue = daysUntil < 0
                  
                  return (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <Badge variant={isOverdue ? 'destructive' : isActive ? 'default' : 'secondary'}>
                            {isOverdue ? 'Overdue' : isActive ? 'Active' : 'Completed'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {plan.studyLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Subjects: {plan.subjects.join(', ')}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {new Date(plan.targetDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {plan.dailyHours}h/day
                          </span>
                          <span>
                            {daysUntil > 0 ? `${daysUntil} days left` : daysUntil === 0 ? 'Due today' : `${Math.abs(daysUntil)} days overdue`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Created: {new Date(plan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleViewPlan(plan.id)}
                          className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui"
                        >
                          View Plan
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {studyPlans.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Tips</CardTitle>
                <CardDescription>Maximize your learning efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Use Active Recall</p>
                      <p className="text-xs text-gray-600">Test yourself regularly instead of just re-reading</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Take Regular Breaks</p>
                      <p className="text-xs text-gray-600">Use the Pomodoro technique: 25 min study, 5 min break</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-studypal-amber/10 rounded-lg">
                    <div className="w-2 h-2 bg-studypal-amber rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Practice Spaced Repetition</p>
                      <p className="text-xs text-gray-600">Review material at increasing intervals</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Subjects</CardTitle>
                <CardDescription>All subjects across your study plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...new Set(studyPlans.flatMap(plan => plan.subjects))].map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{subject}</span>
                      <Badge variant="secondary" className="text-xs">
                        {studyPlans.filter(plan => plan.subjects.includes(subject)).length} plan{studyPlans.filter(plan => plan.subjects.includes(subject)).length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}