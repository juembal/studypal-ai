import { StudyPlan, StudyPlanRequest } from './types'

export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
  subject: string
  planId: string
  planName: string
}

export interface ScheduleConflict {
  day: string
  timeSlot: string
  existingSubject: string
  newSubject: string
  existingPlan: string
}

export class ScheduleManager {
  static parseTimeSlot(timeSlot: string): { start: number, end: number } | null {
    // Parse time slots like "9:00 AM - 11:00 AM" or "2:00-4:00 PM"
    const timeRegex = /(\d{1,2}):?(\d{0,2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i
    const match = timeSlot.match(timeRegex)
    
    if (!match) return null
    
    let startHour = parseInt(match[1])
    const startMin = parseInt(match[2] || '0')
    let endHour = parseInt(match[4])
    const endMin = parseInt(match[5] || '0')
    
    const startPeriod = match[3]?.toUpperCase()
    const endPeriod = match[6]?.toUpperCase() || startPeriod
    
    // Convert to 24-hour format
    if (startPeriod === 'PM' && startHour !== 12) startHour += 12
    if (startPeriod === 'AM' && startHour === 12) startHour = 0
    if (endPeriod === 'PM' && endHour !== 12) endHour += 12
    if (endPeriod === 'AM' && endHour === 12) endHour = 0
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    return { start: startMinutes, end: endMinutes }
  }

  static extractTimeSlots(studyPlan: StudyPlan, planId: string, planName: string): TimeSlot[] {
    const timeSlots: TimeSlot[] = []
    
    if (!studyPlan.weeklySchedule) return timeSlots
    
    Object.entries(studyPlan.weeklySchedule).forEach(([day, schedule]) => {
      if (schedule.subjects && Array.isArray(schedule.subjects)) {
        schedule.subjects.forEach(subject => {
          const parsedTime = this.parseTimeSlot(subject.timeSlot)
          if (parsedTime) {
            timeSlots.push({
              day,
              startTime: subject.timeSlot.split(' - ')[0] || subject.timeSlot.split('–')[0],
              endTime: subject.timeSlot.split(' - ')[1] || subject.timeSlot.split('–')[1],
              subject: subject.subject,
              planId,
              planName
            })
          }
        })
      }
    })
    
    return timeSlots
  }

  static getAllExistingTimeSlots(): TimeSlot[] {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const allTimeSlots: TimeSlot[] = []
      
      savedPlans.forEach((plan: any) => {
        if (plan.fullPlan && plan.status !== 'completed') {
          const timeSlots = this.extractTimeSlots(plan.fullPlan, plan.id, plan.name)
          allTimeSlots.push(...timeSlots)
        }
      })
      
      return allTimeSlots
    } catch (error) {
      console.error('Error loading existing time slots:', error)
      return []
    }
  }

  static checkConflicts(newPlan: StudyPlan, excludePlanId?: string): ScheduleConflict[] {
    return this.detectConflicts(newPlan, excludePlanId);
  }

  static detectConflicts(newPlan: StudyPlan, excludePlanId?: string): ScheduleConflict[] {
    const existingSlots = this.getAllExistingTimeSlots()
      .filter(slot => slot.planId !== excludePlanId)
    
    const newSlots = this.extractTimeSlots(newPlan, 'new', 'New Plan')
    const conflicts: ScheduleConflict[] = []
    
    newSlots.forEach(newSlot => {
      const newTime = this.parseTimeSlot(`${newSlot.startTime} - ${newSlot.endTime}`)
      if (!newTime) return
      
      existingSlots.forEach(existingSlot => {
        if (existingSlot.day !== newSlot.day) return
        
        const existingTime = this.parseTimeSlot(`${existingSlot.startTime} - ${existingSlot.endTime}`)
        if (!existingTime) return
        
        // Check for time overlap
        const hasOverlap = (
          (newTime.start < existingTime.end && newTime.end > existingTime.start)
        )
        
        if (hasOverlap) {
          conflicts.push({
            day: newSlot.day,
            timeSlot: `${newSlot.startTime} - ${newSlot.endTime}`,
            existingSubject: existingSlot.subject,
            newSubject: newSlot.subject,
            existingPlan: existingSlot.planName
          })
        }
      })
    })
    
    return conflicts
  }

  static generateExistingScheduleContext(): string {
    const existingSlots = this.getAllExistingTimeSlots()
    
    if (existingSlots.length === 0) {
      return "No existing study schedules to consider."
    }
    
    const scheduleByDay: { [key: string]: TimeSlot[] } = {}
    existingSlots.forEach(slot => {
      if (!scheduleByDay[slot.day]) {
        scheduleByDay[slot.day] = []
      }
      scheduleByDay[slot.day].push(slot)
    })
    
    let context = "EXISTING STUDY SCHEDULE COMMITMENTS (AVOID CONFLICTS):\n"
    Object.entries(scheduleByDay).forEach(([day, slots]) => {
      context += `${day}:\n`
      slots.forEach(slot => {
        context += `  - ${slot.startTime} - ${slot.endTime}: ${slot.subject} (from "${slot.planName}")\n`
      })
    })
    
    context += "\nIMPORTANT: Do not schedule any new study sessions that overlap with these existing time slots. Choose different times or days for the new plan."
    
    return context
  }

  static generateAvailableTimeSlots(conflicts: ScheduleConflict[]): { day: string, timeRange: string }[] {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const timeSlots = [
      '6:00 AM - 8:00 AM',
      '8:00 AM - 10:00 AM', 
      '10:00 AM - 12:00 PM',
      '12:00 PM - 2:00 PM',
      '2:00 PM - 4:00 PM',
      '4:00 PM - 6:00 PM',
      '6:00 PM - 8:00 PM',
      '8:00 PM - 10:00 PM'
    ]
    
    const existingSlots = this.getAllExistingTimeSlots()
    const availableSlots: { day: string, timeRange: string }[] = []
    
    // Get all occupied time slots
    const occupiedSlots = new Set<string>()
    existingSlots.forEach(slot => {
      occupiedSlots.add(`${slot.day}:${slot.startTime} - ${slot.endTime}`)
    })
    
    // Generate available slots
    allDays.forEach(day => {
      timeSlots.forEach(timeRange => {
        const slotKey = `${day}:${timeRange}`
        if (!occupiedSlots.has(slotKey)) {
          availableSlots.push({ day, timeRange })
        }
      })
    })
    
    return availableSlots
  }

  static createManualConflictFreePlan(formData: any, availableSlots: { day: string, timeRange: string }[]): any {
    const subjects = formData.subjects
    const dailyHours = formData.dailyHours
    const weeklySchedule: any = {}
    
    // Initialize all days
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    allDays.forEach(day => {
      weeklySchedule[day] = { subjects: [], totalHours: 0 }
    })
    
    // Distribute subjects across available slots
    let subjectIndex = 0
    let totalHoursScheduled = 0
    const targetWeeklyHours = dailyHours * 5 // Assume 5 study days per week
    
    for (const slot of availableSlots) {
      if (totalHoursScheduled >= targetWeeklyHours) break
      if (weeklySchedule[slot.day].totalHours >= dailyHours) continue
      
      const subject = subjects[subjectIndex % subjects.length]
      const sessionDuration = Math.min(2, dailyHours - weeklySchedule[slot.day].totalHours)
      
      if (sessionDuration > 0) {
        weeklySchedule[slot.day].subjects.push({
          subject: subject,
          duration: sessionDuration,
          timeSlot: slot.timeRange,
          focus: `${subject} fundamentals and practice`,
          priority: subjectIndex < subjects.length ? 'high' : 'medium'
        })
        
        weeklySchedule[slot.day].totalHours += sessionDuration
        totalHoursScheduled += sessionDuration
        subjectIndex++
      }
    }
    
    // Generate basic study plan structure
    return {
      weeklySchedule,
      revisionSchedule: subjects.map((subject: string, index: number) => ({
        subject,
        date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        topics: [`${subject} review`, `${subject} practice problems`],
        duration: 2
      })),
      learningTips: [
        'Use active recall techniques during study sessions',
        'Take regular breaks to maintain focus',
        'Review material within 24 hours of learning',
        'Practice spaced repetition for better retention'
      ],
      examStrategy: [
        'Create a revision timeline leading up to exams',
        'Focus on weak areas identified during practice',
        'Use past papers and mock tests',
        'Maintain a consistent study routine'
      ],
      flashcards: subjects.flatMap((subject: string) => [
        {
          subject,
          question: `What are the key concepts in ${subject}?`,
          answer: `Review the fundamental principles and core topics of ${subject}`,
          difficulty: 'medium'
        }
      ]),
      onlineResources: subjects.map((subject: string) => ({
        title: `Khan Academy: ${subject}`,
        url: `https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(subject)}`,
        type: 'video',
        subject,
        topic: `${subject} fundamentals`,
        description: `Comprehensive ${subject} lessons and practice exercises`,
        difficulty: 'beginner',
        estimatedTime: '30-60 minutes',
        isFree: true
      }))
    }
  }
}