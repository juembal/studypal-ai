import { StudyPlan, StudyPlanRequest, StudySession } from './types'

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
  existingPlanId: string
}

export class ScheduleManager {
  static parseTimeSlot(timeSlot: string): { start: number, end: number } | null {
    // Check if timeSlot is valid
    if (!timeSlot || typeof timeSlot !== 'string') {
      return null
    }
    
    // Clean up the timeSlot string
    timeSlot = timeSlot.trim()
    
    // Parse time slots like "9:00 AM - 11:00 AM", "2:00-4:00 PM", "9-11 AM", etc.
    const timeRegex = /(\d{1,2}):?(\d{0,2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i
    const match = timeSlot.match(timeRegex)
    
    if (!match) {
      console.warn('Could not parse time slot:', timeSlot)
      return null
    }
    
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
    
    // Validate that end time is after start time
    if (endMinutes <= startMinutes) {
      console.warn('Invalid time range - end time is not after start time:', timeSlot)
      return null
    }
    
    return { start: startMinutes, end: endMinutes }
  }

  static extractTimeSlots(studyPlan: StudyPlan, planId: string, planName: string): TimeSlot[] {
    const timeSlots: TimeSlot[] = []
    
    // Handle both weeklySchedule and sessions structures
    if (!studyPlan) return timeSlots
    
    console.log(`Extracting time slots from plan "${planName}" (${planId})`)
    
    // Handle weeklySchedule structure (preferred format)
    if (studyPlan.weeklySchedule && typeof studyPlan.weeklySchedule === 'object') {
      console.log('Using weeklySchedule structure')
      Object.entries(studyPlan.weeklySchedule).forEach(([day, schedule]: [string, any]) => {
        if (schedule && schedule.subjects && Array.isArray(schedule.subjects)) {
          schedule.subjects.forEach((subject: any) => {
            // Check if subject exists and has a valid timeSlot
            if (!subject || !subject.timeSlot || typeof subject.timeSlot !== 'string') {
              console.log('Skipping invalid subject:', subject)
              return // Skip this subject if no valid timeSlot
            }
            
            const parsedTime = this.parseTimeSlot(subject.timeSlot)
            if (parsedTime) {
              const timeParts = subject.timeSlot.split(/\s*[-–—]\s*/)
              if (timeParts.length >= 2) {
                timeSlots.push({
                  day,
                  startTime: timeParts[0].trim(),
                  endTime: timeParts[1].trim(),
                  subject: subject.subject || 'Unknown Subject',
                  planId,
                  planName
                })
              }
            }
          })
        }
      })
    }
    // Handle sessions structure ONLY if weeklySchedule is not available (to prevent double extraction)
    else if (studyPlan.sessions && Array.isArray(studyPlan.sessions)) {
      console.log('Using sessions structure (fallback)')
      studyPlan.sessions.forEach((session: StudySession) => {
        if (session && session.day && session.timeSlot) {
          const parsedTime = this.parseTimeSlot(session.timeSlot)
          if (parsedTime) {
            const timeParts = session.timeSlot.split(/\s*[-–—]\s*/)
            if (timeParts.length >= 2) {
              timeSlots.push({
                day: session.day,
                startTime: timeParts[0].trim(),
                endTime: timeParts[1].trim(),
                subject: session.subject || session.topic || 'Unknown Subject',
                planId,
                planName
              })
            }
          }
        }
      })
    }
    
    console.log(`Extracted ${timeSlots.length} time slots from plan "${planName}":`, timeSlots)
    return timeSlots
  }

  static getAllExistingTimeSlots(): TimeSlot[] {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const allTimeSlots: TimeSlot[] = []
      
      console.log('=== LOADING EXISTING PLANS ===')
      console.log('Total saved plans:', savedPlans.length)
      
      savedPlans.forEach((plan: { id?: string, name?: string, fullPlan?: StudyPlan, status?: string, createdAt?: string }) => {
        try {
          // Skip completed, inactive, or very old plans
          if (plan.status === 'completed' || plan.status === 'inactive') {
            console.log(`Skipping ${plan.status} plan:`, plan.name)
            return
          }
          
          // Skip plans older than 30 days to prevent conflicts with outdated schedules
          if (plan.createdAt) {
            const planDate = new Date(plan.createdAt)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            if (planDate < thirtyDaysAgo) {
              console.log(`Skipping old plan (${planDate.toDateString()}):`, plan.name)
              return
            }
          }
          
          if (plan.fullPlan) {
            console.log(`Including active plan:`, plan.name)
            const timeSlots = this.extractTimeSlots(plan.fullPlan, plan.id || 'unknown', plan.name || 'Unknown Plan')
            allTimeSlots.push(...timeSlots)
          }
        } catch (planError) {
          console.warn('Error processing plan:', plan.id || 'unknown', planError)
          // Continue with other plans instead of failing completely
        }
      })
      
      console.log('=== ACTIVE TIME SLOTS LOADED ===')
      console.log('Total active time slots:', allTimeSlots.length)
      
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
    
    console.log('=== CONFLICT DETECTION START ===')
    console.log('Existing slots count:', existingSlots.length)
    console.log('New slots count:', newSlots.length)
    console.log('Exclude plan ID:', excludePlanId)
    
    if (existingSlots.length === 0) {
      console.log('No existing slots found - no conflicts possible')
      return conflicts
    }
    
    if (newSlots.length === 0) {
      console.log('No new slots found - no conflicts possible')
      return conflicts
    }
    
    // Normalize day names for comparison
    const normalizeDayName = (day: string): string => {
      const dayMap: { [key: string]: string } = {
        'mon': 'Monday', 'monday': 'Monday',
        'tue': 'Tuesday', 'tuesday': 'Tuesday', 'tues': 'Tuesday',
        'wed': 'Wednesday', 'wednesday': 'Wednesday',
        'thu': 'Thursday', 'thursday': 'Thursday', 'thur': 'Thursday', 'thurs': 'Thursday',
        'fri': 'Friday', 'friday': 'Friday',
        'sat': 'Saturday', 'saturday': 'Saturday',
        'sun': 'Sunday', 'sunday': 'Sunday'
      }
      return dayMap[day.toLowerCase()] || day
    }
    
    newSlots.forEach((newSlot, newIndex) => {
      const newTime = this.parseTimeSlot(`${newSlot.startTime} - ${newSlot.endTime}`)
      if (!newTime) {
        console.log(`Skipping new slot ${newIndex} - could not parse time:`, newSlot)
        return
      }
      
      const normalizedNewDay = normalizeDayName(newSlot.day)
      
      existingSlots.forEach((existingSlot, existingIndex) => {
        const normalizedExistingDay = normalizeDayName(existingSlot.day)
        
        if (normalizedExistingDay !== normalizedNewDay) return
        
        const existingTime = this.parseTimeSlot(`${existingSlot.startTime} - ${existingSlot.endTime}`)
        if (!existingTime) {
          console.log(`Skipping existing slot ${existingIndex} - could not parse time:`, existingSlot)
          return
        }
        
        // Check for time overlap (more precise)
        const hasOverlap = (
          newTime.start < existingTime.end && newTime.end > existingTime.start
        )
        
        if (hasOverlap) {
          // Skip conflicts where the same subject is conflicting with itself
          if (newSlot.subject.toLowerCase() === existingSlot.subject.toLowerCase()) {
            console.log('⚠️ Skipping self-conflict (same subject):', newSlot.subject)
            return
          }
          
          console.log('🚨 CONFLICT DETECTED:')
          console.log('  Day:', normalizedNewDay)
          console.log('  New time:', `${newSlot.startTime} - ${newSlot.endTime} (${newTime.start}-${newTime.end} minutes)`)
          console.log('  Existing time:', `${existingSlot.startTime} - ${existingSlot.endTime} (${existingTime.start}-${existingTime.end} minutes)`)
          console.log('  New subject:', newSlot.subject)
          console.log('  Existing subject:', existingSlot.subject)
          console.log('  Existing plan:', existingSlot.planName)
          
          conflicts.push({
            day: normalizedNewDay,
            timeSlot: `${newSlot.startTime} - ${newSlot.endTime}`,
            existingSubject: existingSlot.subject,
            newSubject: newSlot.subject,
            existingPlan: existingSlot.planName,
            existingPlanId: existingSlot.planId
          })
        }
      })
    })
    
    console.log(`=== CONFLICT DETECTION END: ${conflicts.length} conflicts found ===`)
    
    // Deduplicate conflicts to avoid showing the same conflict multiple times
    const uniqueConflicts = this.deduplicateConflicts(conflicts)
    console.log(`After deduplication: ${uniqueConflicts.length} unique conflicts`)
    
    return uniqueConflicts
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

  static deduplicateConflicts(conflicts: ScheduleConflict[]): ScheduleConflict[] {
    console.log('=== DEDUPLICATION DEBUG ===')
    console.log('Input conflicts:', conflicts.length)
    
    const seen = new Set<string>()
    const uniqueConflicts: ScheduleConflict[] = []
    
    conflicts.forEach((conflict, index) => {
      // Create a unique key based on day and time slot only (ignore plan names for deduplication)
      const conflictKey = `${conflict.day.toLowerCase()}|${conflict.timeSlot}`
      
      console.log(`Conflict ${index}:`, {
        key: conflictKey,
        day: conflict.day,
        timeSlot: conflict.timeSlot,
        existingSubject: conflict.existingSubject,
        newSubject: conflict.newSubject,
        existingPlan: conflict.existingPlan
      })
      
      if (!seen.has(conflictKey)) {
        seen.add(conflictKey)
        uniqueConflicts.push(conflict)
        console.log(`✅ Added unique conflict: ${conflictKey}`)
      } else {
        console.log(`❌ Skipping duplicate conflict: ${conflictKey}`)
      }
    })
    
    console.log('=== DEDUPLICATION RESULT ===')
    console.log('Unique conflicts:', uniqueConflicts.length)
    console.log('Removed duplicates:', conflicts.length - uniqueConflicts.length)
    
    return uniqueConflicts
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

  static createManualConflictFreePlan(formData: StudyPlanRequest, availableSlots: { day: string, timeRange: string }[]): Partial<StudyPlan> {
    console.log('Creating manual conflict-free plan...')
    console.log('Form data:', formData)
    console.log('Available slots:', availableSlots)
    
    const subjects = formData.subjects
    const dailyHours = formData.dailyHours
    const weeklySchedule: { [day: string]: { subjects: Array<{ subject: string, duration: number, timeSlot: string, focus: string, priority: string }>, totalHours: number } } = {}
    
    // Initialize all days
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    allDays.forEach(day => {
      weeklySchedule[day] = { subjects: [], totalHours: 0 }
    })
    
    // Distribute subjects across available slots more intelligently
    let subjectIndex = 0
    let totalHoursScheduled = 0
    const targetWeeklyHours = dailyHours * (formData.includeWeekends === 'all' ? 7 : 5)
    
    // Sort available slots by day to ensure even distribution
    const sortedSlots = availableSlots.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    })
    
    console.log('Sorted slots:', sortedSlots)
    
    for (const slot of sortedSlots) {
      if (totalHoursScheduled >= targetWeeklyHours) break
      if (weeklySchedule[slot.day].totalHours >= dailyHours) continue
      
      const subject = subjects[subjectIndex % subjects.length]
      const remainingDailyHours = dailyHours - weeklySchedule[slot.day].totalHours
      const sessionDuration = Math.min(2, remainingDailyHours, targetWeeklyHours - totalHoursScheduled)
      
      if (sessionDuration > 0) {
        // Use specific topics if provided, with better matching
        const topics = formData.specificTopics && formData.specificTopics.length > 0 ? formData.specificTopics : []
        console.log('Available specific topics:', topics)
        console.log('Current subject:', subject)
        
        // Try to find topics that match this subject
        const subjectTopics = topics.filter(topic => 
          topic.toLowerCase().includes(subject.toLowerCase()) || 
          subject.toLowerCase().includes(topic.toLowerCase()) ||
          // If no subject match, just use the topic as-is for the first subject
          (topics.indexOf(topic) === 0 && formData.subjects[0] === subject)
        )
        
        const focus = subjectTopics.length > 0 ? subjectTopics[0] : 
                     topics.length > 0 ? topics[subjectIndex % topics.length] : 
                     `${subject} fundamentals and practice`
        
        console.log('Selected focus for', subject, ':', focus)
        
        weeklySchedule[slot.day].subjects.push({
          subject: subject,
          duration: sessionDuration,
          timeSlot: slot.timeRange,
          focus: focus,
          priority: subjectIndex < subjects.length ? 'high' : 'medium'
        })
        
        weeklySchedule[slot.day].totalHours += sessionDuration
        totalHoursScheduled += sessionDuration
        subjectIndex++
      }
    }
    
    console.log('Generated weekly schedule:', weeklySchedule)
    console.log('Total hours scheduled:', totalHoursScheduled)
    
    // Generate sessions array from weekly schedule
    const sessions: any[] = []
    let sessionId = 1
    const startDate = new Date()
    
    Object.entries(weeklySchedule).forEach(([day, schedule]) => {
      schedule.subjects.forEach((subject) => {
        // Calculate the next occurrence of this day
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day)
        const today = startDate.getDay()
        const daysUntilTarget = (dayIndex - today + 7) % 7
        const sessionDate = new Date(startDate)
        sessionDate.setDate(startDate.getDate() + daysUntilTarget)
        
        sessions.push({
          id: `session_${sessionId++}`,
          day: day,
          date: sessionDate.toISOString().split('T')[0],
          timeSlot: subject.timeSlot,
          subject: subject.subject,
          topic: subject.focus, // This should now contain your specific topics like "Cell Division"
          duration: subject.duration,
          type: 'study',
          materials: [`${subject.subject} textbook`, `${subject.subject} notes`],
          notes: `Focus on ${subject.focus}`,
          completed: false
        })
        
        console.log('Created session:', {
          subject: subject.subject,
          topic: subject.focus,
          timeSlot: subject.timeSlot,
          day: day
        })
      })
    })
    
    // Generate basic study plan structure
    return {
      weeklySchedule,
      sessions,
      revisionSchedule: subjects.map((subject: string, index: number) => ({
        subject,
        date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        topics: [`${subject} review`, `${subject} practice problems`],
        duration: 2
      })),
      learningTips: [
        'Use active recall techniques during study sessions',
        'Take regular breaks every 25-30 minutes (Pomodoro Technique)',
        'Review material within 24 hours of learning for better retention',
        'Practice spaced repetition for long-term memory',
        'Create summaries and mind maps for complex topics',
        'Test yourself regularly with practice questions',
        'Study in a quiet, well-lit environment',
        'Stay hydrated and maintain good posture while studying'
      ],
      examStrategy: [
        'Create a detailed revision timeline leading up to exams',
        'Use past papers and mock tests to simulate exam conditions',
        'Maintain a consistent study routine and sleep schedule',
        'Form study groups for collaborative learning',
        'Prepare a study checklist for each subject'
      ],
      flashcards: subjects.flatMap((subject: string, subjectIndex: number) => [
        {
          id: `flashcard-${subjectIndex}-${Date.now()}`,
          subject,
          question: `What are the key concepts in ${subject}?`,
          answer: `Review the fundamental principles and core topics of ${subject}`,
          difficulty: 'medium' as const,
          tags: [subject.toLowerCase(), 'fundamentals']
        },
        {
          id: `flashcard-${subjectIndex}-${Date.now() + 1}`,
          subject,
          question: `What study techniques work best for ${subject}?`,
          answer: `Use active recall, practice problems, and spaced repetition for ${subject}`,
          difficulty: 'easy' as const,
          tags: [subject.toLowerCase(), 'study-techniques']
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