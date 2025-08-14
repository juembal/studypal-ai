// Local storage utilities for StudyPal AI

export interface StoredStudyPlan {
  id: string
  name: string
  subjects: string[]
  targetDate: string
  createdAt: string
  dailyHours: number
  studyLevel: string
  fullPlan?: any
}

export const STORAGE_KEYS = {
  STUDY_PLANS: 'studypal_plans',
  USER_PREFERENCES: 'studypal_preferences'
}

export class StudyPlanStorage {
  static getPlans(): StoredStudyPlan[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading study plans:', error)
      return []
    }
  }

  static savePlan(plan: StoredStudyPlan): void {
    try {
      const existingPlans = this.getPlans()
      const updatedPlans = [plan, ...existingPlans]
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error saving study plan:', error)
    }
  }

  static deletePlan(planId: string): void {
    try {
      const existingPlans = this.getPlans()
      const updatedPlans = existingPlans.filter(plan => plan.id !== planId)
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error deleting study plan:', error)
    }
  }

  static clearAllPlans(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.STUDY_PLANS)
    } catch (error) {
      console.error('Error clearing study plans:', error)
    }
  }

  static generatePlanName(subjects: string[]): string {
    if (subjects.length === 1) {
      return `${subjects[0]} Study Plan`
    } else if (subjects.length === 2) {
      return `${subjects.join(' & ')} Study Plan`
    } else {
      return `${subjects.slice(0, 2).join(' & ')} + ${subjects.length - 2} more`
    }
  }
}