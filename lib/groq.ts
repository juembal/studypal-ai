import axios from 'axios'
import { StudyPlan, StudyPlanRequest, StudySession, Flashcard } from './types'

export async function generateStudyPlan(
  request: StudyPlanRequest,
  existingScheduleContext?: any,
  onProgress?: (message: string) => void
): Promise<StudyPlan> {
  // First try the API with retry logic
  const maxRetries = 3
  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Making request to Groq API... (attempt ${attempt}/${maxRetries})`)
      console.log('API Key exists:', !!process.env.GROQ_API_KEY)
      console.log('API Key preview:', process.env.GROQ_API_KEY?.substring(0, 10) + '...')

      if (!process.env.GROQ_API_KEY) {
        console.log('No API key found, falling back to local generation')
        return generateFallbackStudyPlan(request, existingScheduleContext)
      }

      const prompt = buildStudyPlanPrompt(request, existingScheduleContext)

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are StudyPal AI, an expert study planner. Generate comprehensive, personalized study plans in valid JSON format. Always respond with properly formatted JSON that matches the required schema.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          timeout: 30000 // 30 second timeout
        }
      )

      console.log('Groq API response received')
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)
      
      const content = response.data.choices[0].message.content.trim()
      console.log('Raw content from API:', content)
    
    // Extract JSON from the response with better error handling
    let jsonMatch = content.match(/\{[\s\S]*\}/)
    console.log('JSON match found:', !!jsonMatch)
    if (!jsonMatch) {
      console.error('No valid JSON found in response. Content was:', content)
      throw new Error('No valid JSON found in response')
    }

    let jsonString = jsonMatch[0]
    console.log('Extracted JSON string length:', jsonString.length)
    
    let studyPlanData
    
    // Clean up common JSON issues
    try {
      // Fix common escape character issues
      jsonString = jsonString
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/\\\\"/g, '\\"') // Fix double-escaped quotes
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\\n/g, '\\\\n') // Fix newline escapes
        .replace(/\\t/g, '\\\\t') // Fix tab escapes
        .replace(/\\r/g, '\\\\r') // Fix carriage return escapes
      
      console.log('Cleaned JSON string')
      studyPlanData = JSON.parse(jsonString)
      console.log('Successfully parsed JSON')
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Problematic JSON string:', jsonString)
      
      // Try a more aggressive cleanup
      try {
        // Remove problematic characters and try again
        const cleanedJson = jsonString
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove all control characters
          .replace(/\\(?!["\\/bfnrt])/g, '\\\\') // Escape invalid backslashes
          .replace(/\n/g, '\\n') // Escape actual newlines
          .replace(/\r/g, '\\r') // Escape actual carriage returns
          .replace(/\t/g, '\\t') // Escape actual tabs
        
        console.log('Attempting aggressive cleanup...')
        studyPlanData = JSON.parse(cleanedJson)
        console.log('Successfully parsed with aggressive cleanup')
        
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError)
        console.error('Both JSON parsing attempts failed. Creating fallback plan...')
        
        // Create a basic fallback plan structure when JSON parsing completely fails
        console.log('Creating conflict-aware fallback plan...')
        
        // Check if we have existing schedule context to avoid conflicts
        const hasExistingSchedule = existingScheduleContext && 
          typeof existingScheduleContext === 'string' && 
          existingScheduleContext.includes('AVAILABLE TIME SLOTS')
        
        const fallbackPlan: StudyPlan = {
          id: `fallback_plan_${Date.now()}`,
          name: `${request.subjects.join(', ')} Study Plan (Smart Generated)`,
          subjects: request.subjects,
          studyLevel: request.studyLevel,
          totalHours: request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4, // 4 weeks
          dailyHours: request.dailyHours,
          startDate: new Date().toISOString().split('T')[0],
          targetDate: request.targetDate,
          goals: request.goals,
          weeklySchedule: createFallbackWeeklySchedule(request, hasExistingSchedule ? existingScheduleContext : null),
          sessions: createFallbackSessions(request, hasExistingSchedule ? existingScheduleContext : null),
          flashcards: createFallbackFlashcards(request),
          revisionSchedule: [],
          learningTips: [
            'Use active recall techniques during study sessions',
            'Take regular breaks every 25-30 minutes',
            'Review material within 24 hours of learning',
            'Practice spaced repetition for better retention',
            'Create summaries and mind maps for complex topics',
            'Test yourself frequently instead of just re-reading',
            'Study in a quiet, well-lit environment',
            'Stay hydrated and maintain good posture while studying'
          ],
          examStrategy: [
            'Create a detailed revision timeline leading up to exams',
            'Use past papers and mock tests to simulate exam conditions',
            'Maintain a consistent study routine and sleep schedule',
            'Practice time management during mock exams',
            'Review key concepts the night before, avoid cramming new material',
            'Start with easier questions to build confidence'
          ],
          onlineResources: generateOnlineResources(request.subjects, request.specificTopics),
          progress: {
            completedSessions: 0,
            totalSessions: 0,
            completedHours: 0,
            totalHours: request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Update progress with actual session count
        if (fallbackPlan.progress) {
          fallbackPlan.progress.totalSessions = fallbackPlan.sessions.length
        }
        
        console.log('Created fallback plan:', fallbackPlan)
        return fallbackPlan
      }
    }
    
    console.log('Parsed study plan data:', studyPlanData)
    
    // Auto-correct function for consistent formatting
    const autoCorrectSubject = (text: string): string => {
      if (!text) return text
      
      // Find the best matching original subject
      const bestMatch = request.subjects.find(subject => 
        text.toLowerCase().includes(subject.toLowerCase()) || 
        subject.toLowerCase().includes(text.toLowerCase())
      )
      
      return bestMatch || text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim()
    }

    // Filter and auto-correct sessions to only include the original subjects
    const filteredSessions = studyPlanData.sessions ? studyPlanData.sessions
      .filter((session: any) => {
        if (!session.subject) return false
        // Very lenient matching - accept if session subject contains any word from original subjects
        return request.subjects.some(subject => {
          const subjectWords = subject.toLowerCase().split(' ')
          const sessionSubject = session.subject.toLowerCase()
          return subjectWords.some(word => sessionSubject.includes(word)) ||
                 sessionSubject.includes(subject.toLowerCase()) ||
                 subject.toLowerCase().includes(sessionSubject)
        })
      })
      .map((session: any) => ({
        ...session,
        subject: autoCorrectSubject(session.subject),
        topic: session.topic ? autoCorrectSubject(session.topic) : session.topic
      })) : []
    
    // Filter and auto-correct weekly schedule to only include original subjects
    const filteredWeeklySchedule: any = {}
    if (studyPlanData.weeklySchedule) {
      Object.entries(studyPlanData.weeklySchedule).forEach(([day, schedule]: [string, any]) => {
        if (schedule && schedule.subjects) {
          const filteredSubjects = schedule.subjects
            .filter((subjectInfo: any) => {
              if (!subjectInfo.subject) return false
              // Very lenient matching for weekly schedule
              return request.subjects.some(subject => {
                const subjectWords = subject.toLowerCase().split(' ')
                const scheduleSubject = subjectInfo.subject.toLowerCase()
                return subjectWords.some(word => scheduleSubject.includes(word)) ||
                       scheduleSubject.includes(subject.toLowerCase()) ||
                       subject.toLowerCase().includes(scheduleSubject)
              })
            })
            .map((subjectInfo: any) => ({
              ...subjectInfo,
              subject: autoCorrectSubject(subjectInfo.subject),
              focus: subjectInfo.focus ? autoCorrectSubject(subjectInfo.focus) : subjectInfo.focus
            }))
          filteredWeeklySchedule[day] = {
            subjects: filteredSubjects,
            totalHours: filteredSubjects.reduce((total: number, s: any) => total + (s.duration || 0), 0)
          }
        } else {
          filteredWeeklySchedule[day] = { subjects: [], totalHours: 0 }
        }
      })
    }
    
    // Filter flashcards to only include original subjects
    const filteredFlashcards = studyPlanData.flashcards ? studyPlanData.flashcards.filter((card: any) => {
      if (!card.subject) return false
      // Very lenient matching for flashcards
      return request.subjects.some(subject => {
        const subjectWords = subject.toLowerCase().split(' ')
        const cardSubject = card.subject.toLowerCase()
        return subjectWords.some(word => cardSubject.includes(word)) ||
               cardSubject.includes(subject.toLowerCase()) ||
               subject.toLowerCase().includes(cardSubject)
      })
    }) : []
    
    console.log('=== FILTERING DEBUG ===')
    console.log('Original subjects:', request.subjects)
    console.log('Raw sessions from AI:', studyPlanData.sessions?.length || 0)
    console.log('Raw sessions subjects:', studyPlanData.sessions?.map((s: any) => s.subject) || [])
    console.log('Filtered sessions count:', filteredSessions.length)
    console.log('Filtered sessions subjects:', filteredSessions.map((s: any) => s.subject))
    console.log('Raw weekly schedule:', Object.keys(filteredWeeklySchedule).length, 'days')
    console.log('Weekly schedule total subjects:', Object.values(filteredWeeklySchedule).reduce((total: number, day: any) => total + (day.subjects?.length || 0), 0))
    console.log('Filtered flashcards count:', filteredFlashcards.length)
    console.log('Study plan data structure:', {
      name: studyPlanData.name,
      totalHours: studyPlanData.totalHours,
      hasWeeklySchedule: !!studyPlanData.weeklySchedule,
      hasSessions: !!studyPlanData.sessions,
      hasFlashcards: !!studyPlanData.flashcards
    })
    
    // If filtering removed everything, use original data with subject correction
    if (filteredSessions.length === 0 && studyPlanData.sessions && studyPlanData.sessions.length > 0) {
      console.log('⚠️ Filtering removed all sessions, using original with subject correction')
      filteredSessions.push(...studyPlanData.sessions.map((session: any) => ({
        ...session,
        subject: request.subjects[0] || session.subject, // Use first original subject
        topic: session.topic
      })))
    }
    
    // If we still have no sessions, create fallback sessions
    if (filteredSessions.length === 0) {
      console.log('⚠️ No sessions found, creating fallback sessions')
      const fallbackSessions = createFallbackSessions(request, null)
      filteredSessions.push(...fallbackSessions)
    }
    
    // Ensure weekly schedule has content
    const hasWeeklyContent = Object.values(filteredWeeklySchedule).some((day: any) => day.subjects && day.subjects.length > 0)
    if (!hasWeeklyContent) {
      console.log('⚠️ No weekly schedule content, creating fallback schedule')
      const fallbackSchedule = createFallbackWeeklySchedule(request, null)
      Object.assign(filteredWeeklySchedule, fallbackSchedule)
    }
    
    // Ensure the response has the correct structure
    const studyPlan: any = {
      id: `plan_${Date.now()}`,
      name: studyPlanData.name || `${request.subjects.join(', ')} Study Plan`,
      subjects: request.subjects, // Always use the original subjects
      studyLevel: request.studyLevel,
      totalHours: studyPlanData.totalHours || (request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4), // 4 weeks default
      dailyHours: request.dailyHours,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: request.targetDate,
      goals: request.goals,
      sessions: filteredSessions,
      flashcards: filteredFlashcards,
      // Include filtered data from the AI response
      weeklySchedule: filteredWeeklySchedule,
      revisionSchedule: studyPlanData.revisionSchedule || [],
      learningTips: studyPlanData.learningTips || [],
      examStrategy: studyPlanData.examStrategy || [],
      onlineResources: studyPlanData.onlineResources || [],
      progress: {
        completedSessions: 0,
        totalSessions: filteredSessions.length,
        completedHours: 0,
        totalHours: studyPlanData.totalHours || (request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4)
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

      console.log('Final study plan structure:', studyPlan)
      return studyPlan

    } catch (error: any) {
      console.error(`Groq API error on attempt ${attempt}:`, error)
      lastError = error
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers['retry-after'] || Math.pow(2, attempt) * 5 // Exponential backoff
        console.log(`Rate limit hit, waiting ${retryAfter} seconds before retry...`)
        
        if (attempt < maxRetries) {
          // Notify frontend about the wait
          const message = `Rate limit hit, waiting ${retryAfter} seconds before retry...`
          if (onProgress) {
            onProgress(message)
          }
          
          console.log(`Waiting ${retryAfter} seconds before retry attempt ${attempt + 1}...`)
          
          // Create a countdown for better UX
          for (let i = retryAfter; i > 0; i--) {
            if (onProgress) {
              onProgress(`⏳ Retrying in ${i} seconds...`)
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          if (onProgress) {
            onProgress(`🔄 Retrying now...`)
          }
          
          continue // Retry the loop
        } else {
          console.log('Max retries reached for rate limit, falling back to local generation')
          if (onProgress) {
            onProgress('⚡ Generating your personalized study plan...')
          }
          return generateFallbackStudyPlan(request, existingScheduleContext)
        }
      }
      
      // Handle other API errors
      if (error.response?.status === 401) {
        console.log('Invalid API key, falling back to local generation')
        return generateFallbackStudyPlan(request, existingScheduleContext)
      }
      
      if (error.response?.status === 403) {
        console.log('API access forbidden, falling back to local generation')
        return generateFallbackStudyPlan(request, existingScheduleContext)
      }
      
      // For network errors or timeouts, retry
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        console.log(`Network error on attempt ${attempt}, will retry...`)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)) // Progressive delay
          continue
        }
      }
      
      // If it's the last attempt, fall back to local generation
      if (attempt === maxRetries) {
        console.log('All API attempts failed, falling back to local generation')
        return generateFallbackStudyPlan(request, existingScheduleContext)
      }
    }
  }
  
  // This should never be reached, but just in case
  console.log('Unexpected fallback to local generation')
  return generateFallbackStudyPlan(request, existingScheduleContext)
}

// New function to generate a comprehensive fallback study plan
function generateFallbackStudyPlan(request: StudyPlanRequest, existingScheduleContext?: any): StudyPlan {
  console.log('Generating fallback study plan locally...')
  
  const fallbackPlan: StudyPlan = {
    id: `fallback_plan_${Date.now()}`,
    name: `${request.subjects.join(', ')} Study Plan (Smart Generated)`,
    subjects: request.subjects,
    studyLevel: request.studyLevel,
    totalHours: request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4, // 4 weeks
    dailyHours: request.dailyHours,
    startDate: new Date().toISOString().split('T')[0],
    targetDate: request.targetDate,
    goals: request.goals,
    sessions: createFallbackSessions(request, existingScheduleContext),
    flashcards: createFallbackFlashcards(request),
    weeklySchedule: createFallbackWeeklySchedule(request, existingScheduleContext),
    revisionSchedule: [],
    learningTips: [
      'Use active recall techniques during study sessions',
      'Take regular breaks every 25-30 minutes (Pomodoro Technique)',
      'Review material within 24 hours of learning for better retention',
      'Practice spaced repetition for long-term memory',
      'Create summaries and mind maps for complex topics',
      'Test yourself frequently instead of just re-reading',
      'Study in a quiet, well-lit environment',
      'Stay hydrated and maintain good posture while studying',
      'Use the Feynman Technique: explain concepts in simple terms',
      'Create connections between new and existing knowledge',
      'Use multiple learning modalities: visual, auditory, kinesthetic',
      'Set specific, measurable study goals for each session'
    ],
    examStrategy: [
      'Create a detailed revision timeline leading up to exams',
      'Use past papers and mock tests to simulate exam conditions',
      'Maintain a consistent study routine and sleep schedule',
      'Practice time management during mock exams',
      'Review key concepts the night before, avoid cramming new material',
      'Start with easier questions to build confidence',
      'Read all instructions carefully before beginning',
      'Plan your time allocation for each section',
      'Use elimination strategies for multiple-choice questions'
    ],
    onlineResources: generateOnlineResources(request.subjects, request.specificTopics),
    progress: {
      completedSessions: 0,
      totalSessions: 0,
      completedHours: 0,
      totalHours: request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5) * 4
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // Update progress with actual session count
  if (fallbackPlan.progress) {
    fallbackPlan.progress.totalSessions = fallbackPlan.sessions.length
  }
  
  console.log('Fallback study plan generated successfully')
  return fallbackPlan
}

function generateOnlineResources(subjects: string[], specificTopics?: string[]) {
  const resources: any[] = []
  
  subjects.forEach(subject => {
    const subjectLower = subject.toLowerCase()
    
    if (subjectLower.includes('math') || subjectLower.includes('calculus') || subjectLower.includes('algebra')) {
      // Math resources - 6-8 per subject
      resources.push(
        {
          title: `Khan Academy: ${subject}`,
          url: 'https://www.khanacademy.org/math',
          type: 'video',
          subject,
          topic: `${subject} fundamentals`,
          description: `Comprehensive ${subject} lessons from basic to advanced`,
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes',
          isFree: true
        },
        {
          title: `Mathway: Problem Solver`,
          url: 'https://www.mathway.com',
          type: 'tool',
          subject,
          topic: 'Problem solving',
          description: 'Step-by-step math problem solver',
          difficulty: 'all',
          estimatedTime: '5-15 minutes',
          isFree: true
        },
        {
          title: `WolframAlpha: Computational Engine`,
          url: 'https://www.wolframalpha.com',
          type: 'tool',
          subject,
          topic: 'Advanced calculations',
          description: 'Powerful computational knowledge engine',
          difficulty: 'intermediate',
          estimatedTime: '10-30 minutes',
          isFree: true
        },
        {
          title: `Coursera: ${subject} Courses`,
          url: 'https://www.coursera.org/browse/math-and-logic',
          type: 'course',
          subject,
          topic: 'Structured learning',
          description: 'University-level math courses',
          difficulty: 'intermediate',
          estimatedTime: '4-8 weeks',
          isFree: false
        },
        {
          title: `Professor Leonard: ${subject} Videos`,
          url: 'https://www.youtube.com/c/ProfessorLeonard',
          type: 'video',
          subject,
          topic: 'Detailed explanations',
          description: 'Clear, detailed math explanations',
          difficulty: 'intermediate',
          estimatedTime: '45-90 minutes',
          isFree: true
        },
        {
          title: `MIT OpenCourseWare: Mathematics`,
          url: 'https://ocw.mit.edu/courses/mathematics/',
          type: 'course',
          subject,
          topic: 'Advanced mathematics',
          description: 'Free MIT mathematics courses',
          difficulty: 'advanced',
          estimatedTime: 'Varies',
          isFree: true
        }
      )
    } else if (subjectLower.includes('physics')) {
      // Physics resources - 6-8 per subject
      resources.push(
        {
          title: `Khan Academy: Physics`,
          url: 'https://www.khanacademy.org/science/physics',
          type: 'video',
          subject,
          topic: 'Physics concepts',
          description: 'Interactive physics lessons and simulations',
          difficulty: 'beginner',
          estimatedTime: '45-90 minutes',
          isFree: true
        },
        {
          title: `Physics Classroom`,
          url: 'https://www.physicsclassroom.com',
          type: 'interactive',
          subject,
          topic: 'Physics tutorials',
          description: 'Comprehensive physics tutorials and simulations',
          difficulty: 'intermediate',
          estimatedTime: '30-60 minutes',
          isFree: true
        },
        {
          title: `MIT OpenCourseWare: Physics`,
          url: 'https://ocw.mit.edu/courses/physics/',
          type: 'course',
          subject,
          topic: 'Advanced physics',
          description: 'Free MIT physics courses',
          difficulty: 'advanced',
          estimatedTime: 'Varies',
          isFree: true
        },
        {
          title: `PhET Interactive Simulations`,
          url: 'https://phet.colorado.edu',
          type: 'simulation',
          subject,
          topic: 'Physics simulations',
          description: 'Interactive physics and chemistry simulations',
          difficulty: 'all',
          estimatedTime: '20-45 minutes',
          isFree: true
        },
        {
          title: `Coursera: Physics Courses`,
          url: 'https://www.coursera.org/browse/physical-science-and-engineering/physics-and-astronomy',
          type: 'course',
          subject,
          topic: 'Structured physics learning',
          description: 'University-level physics courses',
          difficulty: 'intermediate',
          estimatedTime: '4-8 weeks',
          isFree: false
        },
        {
          title: `HyperPhysics`,
          url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/hframe.html',
          type: 'reference',
          subject,
          topic: 'Physics concepts',
          description: 'Comprehensive physics concept maps',
          difficulty: 'intermediate',
          estimatedTime: '15-30 minutes',
          isFree: true
        }
      )
    } else if (subjectLower.includes('chemistry')) {
      // Chemistry resources - 6-8 per subject
      resources.push(
        {
          title: `Khan Academy: Chemistry`,
          url: 'https://www.khanacademy.org/science/chemistry',
          type: 'video',
          subject,
          topic: 'Chemistry fundamentals',
          description: 'Complete chemistry course with practice problems',
          difficulty: 'beginner',
          estimatedTime: '45-90 minutes',
          isFree: true
        },
        {
          title: `ChemGuide`,
          url: 'https://www.chemguide.co.uk',
          type: 'reference',
          subject,
          topic: 'Chemistry concepts',
          description: 'Comprehensive chemistry reference guide',
          difficulty: 'intermediate',
          estimatedTime: '20-40 minutes',
          isFree: true
        },
        {
          title: `MIT OpenCourseWare: Chemistry`,
          url: 'https://ocw.mit.edu/courses/chemistry/',
          type: 'course',
          subject,
          topic: 'Advanced chemistry',
          description: 'Free MIT chemistry courses',
          difficulty: 'advanced',
          estimatedTime: 'Varies',
          isFree: true
        },
        {
          title: `ChemCollective`,
          url: 'http://chemcollective.org',
          type: 'simulation',
          subject,
          topic: 'Virtual chemistry labs',
          description: 'Virtual chemistry laboratory simulations',
          difficulty: 'intermediate',
          estimatedTime: '30-60 minutes',
          isFree: true
        },
        {
          title: `Coursera: Chemistry Courses`,
          url: 'https://www.coursera.org/browse/physical-science-and-engineering/chemistry',
          type: 'course',
          subject,
          topic: 'Structured chemistry learning',
          description: 'University-level chemistry courses',
          difficulty: 'intermediate',
          estimatedTime: '4-8 weeks',
          isFree: false
        },
        {
          title: `Crash Course Chemistry`,
          url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr',
          type: 'video',
          subject,
          topic: 'Chemistry overview',
          description: 'Engaging chemistry video series',
          difficulty: 'beginner',
          estimatedTime: '10-15 minutes',
          isFree: true
        }
      )
    } else if (subjectLower.includes('biology')) {
      // Biology resources - 6-8 per subject
      resources.push(
        {
          title: `Khan Academy: Biology`,
          url: 'https://www.khanacademy.org/science/biology',
          type: 'video',
          subject,
          topic: 'Biology concepts',
          description: 'Comprehensive biology lessons with animations',
          difficulty: 'beginner',
          estimatedTime: '45-90 minutes',
          isFree: true
        },
        {
          title: `Biology Corner`,
          url: 'https://www.biologycorner.com',
          type: 'resource',
          subject,
          topic: 'Biology worksheets',
          description: 'Biology worksheets and activities',
          difficulty: 'intermediate',
          estimatedTime: '20-40 minutes',
          isFree: true
        },
        {
          title: `Coursera: Biology Courses`,
          url: 'https://www.coursera.org/browse/life-sciences',
          type: 'course',
          subject,
          topic: 'Structured biology learning',
          description: 'University-level biology courses',
          difficulty: 'intermediate',
          estimatedTime: '4-8 weeks',
          isFree: false
        },
        {
          title: `MIT OpenCourseWare: Biology`,
          url: 'https://ocw.mit.edu/courses/biology/',
          type: 'course',
          subject,
          topic: 'Advanced biology',
          description: 'Free MIT biology courses',
          difficulty: 'advanced',
          estimatedTime: 'Varies',
          isFree: true
        },
        {
          title: `Crash Course Biology`,
          url: 'https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF',
          type: 'video',
          subject,
          topic: 'Biology overview',
          description: 'Engaging biology video series',
          difficulty: 'beginner',
          estimatedTime: '10-15 minutes',
          isFree: true
        },
        {
          title: `BioInteractive`,
          url: 'https://www.biointeractive.org',
          type: 'interactive',
          subject,
          topic: 'Biology simulations',
          description: 'Interactive biology resources and simulations',
          difficulty: 'intermediate',
          estimatedTime: '30-60 minutes',
          isFree: true
        }
      )
    } else {
      // Generic resources for other subjects - 4-6 per subject
      resources.push(
        {
          title: `Khan Academy: ${subject}`,
          url: `https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(subject)}`,
          type: 'video',
          subject,
          topic: `${subject} fundamentals`,
          description: `Educational content for ${subject}`,
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes',
          isFree: true
        },
        {
          title: `Coursera: ${subject} Courses`,
          url: `https://www.coursera.org/search?query=${encodeURIComponent(subject)}`,
          type: 'course',
          subject,
          topic: `Structured ${subject} learning`,
          description: `University-level ${subject} courses`,
          difficulty: 'intermediate',
          estimatedTime: '4-8 weeks',
          isFree: false
        },
        {
          title: `YouTube: ${subject} Tutorials`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`,
          type: 'video',
          subject,
          topic: `${subject} tutorials`,
          description: `Video tutorials for ${subject}`,
          difficulty: 'all',
          estimatedTime: '15-45 minutes',
          isFree: true
        },
        {
          title: `MIT OpenCourseWare: ${subject}`,
          url: 'https://ocw.mit.edu',
          type: 'course',
          subject,
          topic: `Advanced ${subject}`,
          description: `Free MIT courses related to ${subject}`,
          difficulty: 'advanced',
          estimatedTime: 'Varies',
          isFree: true
        }
      )
    }
  })
  
  // Add general study resources
  resources.push(
    {
      title: 'Coursera: Learning How to Learn',
      url: 'https://www.coursera.org/learn/learning-how-to-learn',
      type: 'course',
      subject: 'Study Skills',
      topic: 'Effective Learning Techniques',
      description: 'Popular course on learning techniques and memory',
      difficulty: 'beginner',
      estimatedTime: '4 weeks',
      isFree: true
    },
    {
      title: 'Anki: Spaced Repetition',
      url: 'https://apps.ankiweb.net',
      type: 'tool',
      subject: 'Study Skills',
      topic: 'Memory and retention',
      description: 'Powerful spaced repetition flashcard system',
      difficulty: 'all',
      estimatedTime: '15-30 minutes daily',
      isFree: true
    },
    {
      title: 'Pomodoro Timer',
      url: 'https://pomofocus.io',
      type: 'tool',
      subject: 'Study Skills',
      topic: 'Time management',
      description: 'Focus timer using the Pomodoro Technique',
      difficulty: 'all',
      estimatedTime: '25 minute sessions',
      isFree: true
    }
  )
  
  return resources
}

function getTimeSlotFromPreference(preferredTimes: string): string {
  // Extract the time preference from the string
  const preference = preferredTimes.toLowerCase()
  
  if (preference.includes('early-bird') || preference.includes('5-9 am')) {
    return 'ONLY schedule sessions between 5:00 AM - 9:00 AM. Do NOT use any other time slots.'
  } else if (preference.includes('morning') || preference.includes('9 am-12 pm')) {
    return 'ONLY schedule sessions between 9:00 AM - 12:00 PM. Do NOT use any other time slots.'
  } else if (preference.includes('afternoon') || preference.includes('12-5 pm')) {
    return 'ONLY schedule sessions between 12:00 PM - 5:00 PM. Do NOT use any other time slots.'
  } else if (preference.includes('evening') || preference.includes('5-9 pm')) {
    return 'ONLY schedule sessions between 5:00 PM - 9:00 PM. Do NOT use any other time slots.'
  } else if (preference.includes('night-owl') || preference.includes('9 pm-12 am')) {
    return 'ONLY schedule sessions between 9:00 PM - 12:00 AM. Do NOT use any other time slots.'
  } else if (preference.includes('flexible')) {
    return 'Use flexible scheduling across different time periods as needed.'
  } else {
    // If it's a custom time specification, use it directly
    return `ONLY use these specific time slots: ${preferredTimes}. Do NOT use any other time slots.`
  }
}

function getExampleTimeSlot(preferredTimes?: string): string {
  if (!preferredTimes) return '9:00 AM - 10:30 AM'
  
  const preference = preferredTimes.toLowerCase()
  if (preference.includes('early-bird') || preference.includes('5-9 am')) {
    return '5:00 AM - 6:30 AM'
  } else if (preference.includes('morning') || preference.includes('9 am-12 pm')) {
    return '9:00 AM - 10:30 AM'
  } else if (preference.includes('afternoon') || preference.includes('12-5 pm')) {
    return '12:00 PM - 1:30 PM'
  } else if (preference.includes('evening') || preference.includes('5-9 pm')) {
    return '5:00 PM - 6:30 PM'
  } else if (preference.includes('night-owl') || preference.includes('9 pm-12 am')) {
    return '9:00 PM - 10:30 PM'
  } else {
    return '9:00 AM - 10:30 AM'
  }
}

function getSecondExampleTimeSlot(preferredTimes?: string): string {
  if (!preferredTimes) return '2:00 PM - 3:30 PM'
  
  const preference = preferredTimes.toLowerCase()
  if (preference.includes('early-bird') || preference.includes('5-9 am')) {
    return '7:30 AM - 9:00 AM'
  } else if (preference.includes('morning') || preference.includes('9 am-12 pm')) {
    return '10:30 AM - 12:00 PM'
  } else if (preference.includes('afternoon') || preference.includes('12-5 pm')) {
    return '2:00 PM - 3:30 PM'
  } else if (preference.includes('evening') || preference.includes('5-9 pm')) {
    return '7:00 PM - 8:30 PM'
  } else if (preference.includes('night-owl') || preference.includes('9 pm-12 am')) {
    return '10:30 PM - 12:00 AM'
  } else {
    return '2:00 PM - 3:30 PM'
  }
}

function getTimeSlotsFromPreference(preferredTimes: string): string[] {
  // Extract the time preference from the string
  const preference = preferredTimes.toLowerCase()
  
  if (preference.includes('early-bird') || preference.includes('5-9 am')) {
    return [
      '5:00 AM - 6:30 AM',
      '6:30 AM - 8:00 AM', 
      '8:00 AM - 9:00 AM'
    ]
  } else if (preference.includes('morning') || preference.includes('9 am-12 pm')) {
    return [
      '9:00 AM - 10:30 AM',
      '10:30 AM - 12:00 PM',
      '9:30 AM - 11:00 AM',
      '11:00 AM - 12:00 PM'
    ]
  } else if (preference.includes('afternoon') || preference.includes('12-5 pm')) {
    return [
      '12:00 PM - 1:30 PM',
      '1:30 PM - 3:00 PM',
      '3:00 PM - 4:30 PM',
      '2:00 PM - 3:30 PM',
      '3:30 PM - 5:00 PM'
    ]
  } else if (preference.includes('evening') || preference.includes('5-9 pm')) {
    return [
      '5:00 PM - 6:30 PM',
      '6:30 PM - 8:00 PM',
      '8:00 PM - 9:00 PM',
      '7:00 PM - 8:30 PM'
    ]
  } else if (preference.includes('night-owl') || preference.includes('9 pm-12 am')) {
    return [
      '9:00 PM - 10:30 PM',
      '10:30 PM - 12:00 AM',
      '9:30 PM - 11:00 PM'
    ]
  } else {
    // Default flexible time slots
    return [
      '9:00 AM - 10:30 AM',
      '2:00 PM - 3:30 PM',
      '7:00 PM - 8:30 PM',
      '10:30 AM - 12:00 PM',
      '3:30 PM - 5:00 PM'
    ]
  }
}

function buildStudyPlanPrompt(request: StudyPlanRequest, existingScheduleContext?: any): string {
  let contextInfo = ''
  
  if (existingScheduleContext) {
    if (typeof existingScheduleContext === 'string') {
      contextInfo = `\n\n🚨 CRITICAL SCHEDULING CONSTRAINTS:\n${existingScheduleContext}\n\n⚠️ FAILURE TO FOLLOW THESE CONSTRAINTS WILL RESULT IN SCHEDULING CONFLICTS!`
    } else {
      contextInfo = `\n\nExisting Schedule Context:\n${JSON.stringify(existingScheduleContext, null, 2)}`
    }
  }

  return `Generate a comprehensive study plan with the following requirements:

**Study Plan Requirements:**
- Subjects: ${request.subjects.join(', ')} (EXACTLY these ${request.subjects.length} subject${request.subjects.length > 1 ? 's' : ''} - do NOT add or split into sub-subjects)
- Study Level: ${request.studyLevel}
- Daily Hours: ${request.dailyHours}
- Target Date: ${request.targetDate}
- **SPECIFIC TOPICS TO FOCUS ON**: ${request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics.join(', ') : 'General subject coverage'}
- Goals: ${request.goals || 'General mastery'}
- Learning Style: ${request.learningStyle || 'mixed'}
- Difficulty Level: ${request.difficulty || 'intermediate'}
- Current Knowledge: ${request.currentKnowledge || 'beginner'}
- Preferences: ${request.preferences || 'none specified'}

**Required JSON Structure:**
{
  "name": "Study Plan Name",
  "totalHours": ${request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5)},
  "weeklySchedule": {
    "Monday": {
      "subjects": [
        {
          "subject": "Subject Name",
          "duration": 1.5,
          "timeSlot": "${getExampleTimeSlot(request.preferredTimes)}",
          "focus": "${request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics[0] : 'Specific topic or area'}",
          "priority": "high",
          "type": "lecture"
        },
        {
          "subject": "Subject Name",
          "duration": 1.5,
          "timeSlot": "${getSecondExampleTimeSlot(request.preferredTimes)}",
          "focus": "${request.specificTopics && request.specificTopics.length > 1 ? request.specificTopics[1] : request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics[0] + ' Practice' : 'Practice exercises'}",
          "priority": "medium",
          "type": "practice"
        }
      ],
      "totalHours": 3
    },
    "Tuesday": {
      "subjects": [],
      "totalHours": 0
    }
  },
  "sessions": [
    {
      "id": "session_1",
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "timeSlot": "${getExampleTimeSlot(request.preferredTimes)}",
      "subject": "Subject Name",
      "topic": "${request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics[0] : 'Specific Topic'}",
      "duration": 1.5,
      "type": "lecture|practice|review|assessment",
      "materials": ["Material 1", "Material 2"],
      "notes": "Study notes or tips",
      "completed": false
    }
  ],
  "flashcards": [
    {
      "id": "card_1",
      "subject": "Subject Name",
      "question": "Question text",
      "answer": "Answer text",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"]
    }
  ],
  "learningTips": [
    "Use active recall techniques",
    "Take regular breaks every 25-30 minutes",
    "Review material within 24 hours",
    "Practice spaced repetition"
  ],
  "examStrategy": [
    "Create a revision timeline",
    "Focus on weak areas first",
    "Use past papers for practice",
    "Get adequate sleep before exams"
  ],
  "onlineResources": [
    {
      "title": "Khan Academy: Mathematics",
      "url": "https://www.khanacademy.org/math",
      "type": "video",
      "subject": "Mathematics",
      "topic": "Algebra and Calculus",
      "description": "Free comprehensive math lessons from basic to advanced",
      "difficulty": "beginner",
      "estimatedTime": "30-60 minutes",
      "isFree": true
    },
    {
      "title": "Coursera: Learning How to Learn",
      "url": "https://www.coursera.org/learn/learning-how-to-learn",
      "type": "course",
      "subject": "Study Skills",
      "topic": "Effective Learning Techniques",
      "description": "Popular course on learning techniques and memory",
      "difficulty": "beginner",
      "estimatedTime": "4 weeks",
      "isFree": true
    },
    {
      "title": "MIT OpenCourseWare",
      "url": "https://ocw.mit.edu",
      "type": "course",
      "subject": "Various",
      "topic": "University-level courses",
      "description": "Free access to MIT course materials",
      "difficulty": "advanced",
      "estimatedTime": "Varies",
      "isFree": true
    }
  ]
}

**Instructions:**
1. **CRITICAL**: Use ONLY the ${request.subjects.length} subject${request.subjects.length > 1 ? 's' : ''} listed above: ${request.subjects.join(', ')}. Do NOT create additional subjects or split them into sub-subjects.
${request.preferredTimes ? `1.5. **🚨 ABSOLUTE TIME RESTRICTION 🚨**: ${getTimeSlotFromPreference(request.preferredTimes)} 
   - EVERY SINGLE timeSlot field MUST be within this range
   - NO sessions outside this time window
   - This is NON-NEGOTIABLE - violating this will make the schedule completely unusable
   - Double-check EVERY timeSlot before responding` : ''}
2. **🎯 MANDATORY TOPIC COVERAGE**: ${request.specificTopics && request.specificTopics.length > 0 ? `
   - SPECIFIC TOPICS TO COVER: ${request.specificTopics.join(', ')}
   - **CRITICAL**: You MUST cover ALL ${request.specificTopics.length} topics: ${request.specificTopics.join(', ')}
   - Distribute sessions evenly across ALL topics - do NOT focus on just one
   - Use these EXACT topic names in the "focus" and "topic" fields
   - Each topic should have multiple sessions (at least 2-3 sessions per topic)
   - Rotate between topics throughout the week
   - Example: If topics are "Quadratic Equations" and "Algebra", create sessions for BOTH topics
   - NEVER focus on just one topic - ensure balanced coverage` : 'Create comprehensive coverage of the subjects with specific topic areas.'}
3. Create a realistic study schedule from today until the target date
4. Distribute EXACTLY ${request.dailyHours} hours per day across the subjects using SMART SCHEDULING:
   - For ${request.dailyHours} daily hours: Create ${Math.ceil(request.dailyHours / 1.5)} sessions of ~1.5 hours each
   - Break longer study periods with different subjects or session types
   - Alternate between intensive and lighter subjects within the same day
5. ${request.includeWeekends === 'weekdays' ? 'Schedule ONLY Monday through Friday (5 days per week)' : request.includeWeekends === 'all' ? 'Include all 7 days of the week' : 'Use 5-6 days per week as needed'}
6. Session Duration Rules:
   - Individual sessions: 1-1.5 hours maximum (optimal for focus and retention)
   - Minimum session: 30 minutes (anything shorter is ineffective)
   - NO sessions longer than 1.5 hours (causes fatigue and poor retention)
7. Total daily hours should EXACTLY equal ${request.dailyHours} hours (not more, not less)
8. Generate specific time slots (e.g., "9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM") for each session
9. ${request.preferredTimes ? `🚨 CRITICAL TIME RESTRICTION - MUST FOLLOW: ${getTimeSlotFromPreference(request.preferredTimes)} ALL sessions must be within this time window. NO EXCEPTIONS.` : 'Use common study hours like 9 AM-12 PM, 2 PM-5 PM, 7 PM-9 PM'}
10. Include INTELLIGENT session variety based on learning science:
    - Session 1 of day: "lecture" (new content absorption - when mind is fresh)
    - Session 2 of day: "practice" (active application - reinforces learning)  
    - Session 3 of day: "review" (consolidation - lighter cognitive load)
    - Session 4+ of day: "assessment" (self-testing - spaced retrieval practice)
11. Generate 20-30 relevant flashcards covering ALL specified topics (at least 3-5 flashcards per topic)
12. Provide 8-12 practical learning tips for effective studying
13. Include 6-10 exam strategy recommendations
14. Add 8-12 online resources for EACH subject (mix of videos, tools, courses, simulations)
15. Include 15-minute breaks between study sessions for optimal learning
16. Ensure progression from basic to advanced topics
17. Include specific materials and resources
18. Add helpful study notes and tips for each session
19. **CRITICAL**: If existing schedule constraints are provided above, you MUST follow them exactly to avoid conflicts

MANDATORY: Your response MUST include ALL sections: sessions, flashcards, learningTips, examStrategy, and onlineResources.

SPECIFIC REQUIREMENTS:
- learningTips: Provide practical, actionable study advice (8-12 tips)
- examStrategy: Include test-taking strategies and preparation methods (6-10 strategies)
- flashcards: **CRITICAL** - Generate 20-30 flashcards covering ALL specified topics:
  ${request.specificTopics && request.specificTopics.length > 0 ? `
  * Create 3-5 flashcards for EACH topic: ${request.specificTopics.join(', ')}
  * Ensure balanced coverage - do NOT focus on just one topic
  * Include questions about definitions, formulas, examples, and applications
  * Mix difficulty levels: easy, medium, hard for each topic` : '* Cover key concepts from all subjects with varied difficulty levels'}
- onlineResources: **CRITICAL** - Generate 8-12 resources for EACH subject (minimum 20+ total resources):
  * Mathematics: Khan Academy, Mathway, WolframAlpha, Coursera Math, Professor Leonard, MIT OCW Math, PatrickJMT, Paul's Online Math Notes
  * Physics: Khan Academy Physics, Physics Classroom, MIT OCW Physics, PhET Simulations, Coursera Physics, HyperPhysics, Crash Course Physics
  * Chemistry: Khan Academy Chemistry, ChemGuide, MIT OCW Chemistry, ChemCollective, Coursera Chemistry, Crash Course Chemistry, ChemSpider
  * Biology: Khan Academy Biology, Biology Corner, MIT OCW Biology, Coursera Biology, Crash Course Biology, BioInteractive, Nature Education
  * Include variety: videos, interactive tools, problem solvers, simulations, courses, references
  * Mix difficulty levels: beginner, intermediate, advanced
  * Include both free and premium options

IMPORTANT: Keep total weekly hours reasonable - aim for ${request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5)} hours per week maximum.

${contextInfo}

**CRITICAL JSON FORMATTING RULES:**
- Respond with ONLY valid JSON, no additional text or formatting
- Do NOT include any backslashes (\) in text content unless properly escaped
- Do NOT include unescaped quotes (") in text content
- Use simple, clean text without special characters
- Avoid newlines, tabs, or control characters in JSON values
- Keep all text content simple and readable

${request.preferredTimes ? `
🚨 **FINAL TIME SLOT VALIDATION** 🚨
Before responding, verify EVERY timeSlot field in your JSON:
- Early Bird: ALL times must be between 5:00 AM - 9:00 AM
- Morning: ALL times must be between 9:00 AM - 12:00 PM  
- Afternoon: ALL times must be between 12:00 PM - 5:00 PM
- Evening: ALL times must be between 5:00 PM - 9:00 PM
- Night Owl: ALL times must be between 9:00 PM - 12:00 AM

If ANY timeSlot is outside the user's preference, the entire response is INVALID.
` : ''}

Respond with ONLY the JSON object following these formatting rules.`
}

function createFallbackWeeklySchedule(request: StudyPlanRequest, existingScheduleContext?: string | null) {
  const schedule: any = {}
  const days = request.includeWeekends === 'all' 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  
  // Get time slots based on user preferences
  let timeSlots = getTimeSlotsFromPreference(request.preferredTimes || '')
  
  if (existingScheduleContext) {
    // Parse available time slots from the context
    const availableSlotMatches = existingScheduleContext.match(/✅ (\w+): (.+)/g)
    if (availableSlotMatches && availableSlotMatches.length > 0) {
      const contextSlots: { [day: string]: string[] } = {}
      availableSlotMatches.forEach(match => {
        const [, day, timeRange] = match.match(/✅ (\w+): (.+)/) || []
        if (day && timeRange) {
          if (!contextSlots[day]) contextSlots[day] = []
          contextSlots[day].push(timeRange)
        }
      })
      
      // Use context slots if available
      if (Object.keys(contextSlots).length > 0) {
        console.log('Using available time slots from context:', contextSlots)
        
        days.forEach(day => {
          schedule[day] = { subjects: [], totalHours: 0 }
        })
        
        // Distribute subjects using available slots
        let subjectIndex = 0
        Object.entries(contextSlots).forEach(([day, slots]) => {
          if (days.includes(day)) {
            slots.forEach(timeSlot => {
              if (schedule[day].totalHours < request.dailyHours && subjectIndex < request.subjects.length * 3) {
                const subject = request.subjects[subjectIndex % request.subjects.length]
                const duration = Math.min(2, request.dailyHours - schedule[day].totalHours, 2) // Max 2 hours per session
                
                if (duration > 0) {
                  // Use specific topics if provided - intelligent matching
                  const topics = request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics : []
                  let focus = `${subject} fundamentals`
                  
                  if (topics.length > 0) {
                    const subjectTopics = topics.filter(topic => {
                      const topicLower = topic.toLowerCase()
                      const subjectLower = subject.toLowerCase()
                      return topicLower.includes(subjectLower) || 
                             subjectLower.includes(topicLower) ||
                             (subjectLower.includes('math') && (topicLower.includes('equation') || topicLower.includes('derivative') || topicLower.includes('calculus') || topicLower.includes('algebra'))) ||
                             (subjectLower.includes('science') && (topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology')))
                    })
                    
                    if (subjectTopics.length > 0) {
                      focus = subjectTopics[subjectIndex % subjectTopics.length]
                    } else if (topics.length > 0) {
                      focus = topics[subjectIndex % topics.length]
                    }
                  }
                  
                  schedule[day].subjects.push({
                    subject,
                    duration,
                    timeSlot,
                    focus: focus,
                    priority: 'high'
                  })
                  schedule[day].totalHours += duration
                  subjectIndex++
                }
              }
            })
          }
        })
        
        return schedule
      }
    }
  }
  
  days.forEach(day => {
    schedule[day] = { subjects: [], totalHours: 0 }
  })
  
  // Intelligent session distribution based on daily hours and subjects
  const sessionsPerDay = Math.ceil(request.dailyHours / 1.5) // Aim for 1.5 hour sessions
  const sessionDuration = request.dailyHours / sessionsPerDay // Distribute hours evenly
  
  // Global counters to ensure balanced topic coverage across all days
  let globalTopicIndex = 0
  let globalSubjectIndex = 0
  
  days.forEach((day, dayIndex) => {
    let dailyHours = 0
    let sessionCount = 0
    
    // Calculate how many sessions this day should have
    const targetSessions = Math.min(sessionsPerDay, Math.ceil((request.dailyHours - dailyHours) / 1.5))
    
    for (let i = 0; i < targetSessions && dailyHours < request.dailyHours; i++) {
      const remainingHours = request.dailyHours - dailyHours
      const duration = Math.min(1.5, Math.max(0.5, remainingHours / (targetSessions - i))) // Distribute remaining hours
      
      if (duration >= 0.5) { // Minimum 30 minutes
        const subject = request.subjects[globalSubjectIndex % request.subjects.length]
        const timeSlot = timeSlots[sessionCount % timeSlots.length]
        
        // Use specific topics if provided - ensure ALL topics are covered globally
        const topics = request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics : []
        let focus = `${subject} fundamentals`
        
        if (topics.length > 0) {
          // Use global topic index to ensure all topics are covered across all days
          focus = topics[globalTopicIndex % topics.length]
          globalTopicIndex++ // Increment for next session
        }
        
        // Determine session type based on session number within the day
        const sessionTypes = ['lecture', 'practice', 'review', 'assessment']
        const sessionType = sessionTypes[sessionCount % sessionTypes.length]
        
        schedule[day].subjects.push({
          subject,
          duration: Math.round(duration * 2) / 2, // Round to nearest 0.5
          timeSlot,
          focus: focus,
          priority: sessionCount === 0 ? 'high' : sessionCount === 1 ? 'medium' : 'low',
          type: sessionType
        })
        
        // Add break between sessions (except for the last session of the day)
        if (sessionCount < targetSessions - 1 && sessionCount < timeSlots.length - 1) {
          const breakDuration = 0.25 // 15-minute break
          schedule[day].subjects.push({
            subject: 'Break',
            duration: breakDuration,
            timeSlot: 'Break Time',
            focus: 'Rest and recharge',
            priority: 'low',
            type: 'break'
          })
          dailyHours += breakDuration
        }
        
        dailyHours += duration
        sessionCount++
        globalSubjectIndex++ // Increment for next session
      }
    }
    
    schedule[day].totalHours = Math.round(dailyHours * 2) / 2 // Round to nearest 0.5
  })
  
  return schedule
}

function createFallbackSessions(request: StudyPlanRequest, existingScheduleContext?: string | null) {
  const sessions: any[] = []
  const startDate = new Date()
  let sessionId = 1
  
  // Use the same logic as weekly schedule to get available time slots
  const weeklySchedule = createFallbackWeeklySchedule(request, existingScheduleContext)
  
  // Generate sessions from the weekly schedule
  Object.entries(weeklySchedule).forEach(([day, schedule]: [string, any]) => {
    if (schedule.subjects && schedule.subjects.length > 0) {
      schedule.subjects.forEach((subjectInfo: any) => {
        // Calculate the next occurrence of this day
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day)
        const today = startDate.getDay()
        const daysUntilTarget = (dayIndex - today + 7) % 7
        const sessionDate = new Date(startDate)
        sessionDate.setDate(startDate.getDate() + daysUntilTarget)
        
        // Only add actual study sessions, not breaks
        if (subjectInfo.subject !== 'Break') {
          sessions.push({
            id: `session_${sessionId++}`,
            day: day,
            date: sessionDate.toISOString().split('T')[0],
            timeSlot: subjectInfo.timeSlot,
            subject: subjectInfo.subject,
            topic: subjectInfo.focus || `${subjectInfo.subject} fundamentals`, // Use the specific focus topic
            duration: subjectInfo.duration,
            type: subjectInfo.type || 'study',
            materials: [`${subjectInfo.subject} textbook`, `${subjectInfo.subject} notes`],
            notes: `Focus on ${subjectInfo.focus}`,
            completed: false
          })
        }
      })
    }
  })
  
  // If no sessions were created, create basic ones with specific topics
  if (sessions.length === 0) {
    const timeSlots = getTimeSlotsFromPreference(request.preferredTimes || '')
    const topics = request.specificTopics && request.specificTopics.length > 0 ? request.specificTopics : []
    
    request.subjects.forEach((subject, index) => {
      const sessionDate = new Date(startDate)
      sessionDate.setDate(startDate.getDate() + index)
      
      // Ensure ALL topics get covered by cycling through them
      let topic = `${subject} fundamentals`
      if (topics.length > 0) {
        // Simple round-robin distribution ensures all topics are covered
        topic = topics[index % topics.length]
      }
      
      sessions.push({
        id: `session_${sessionId++}`,
        day: sessionDate.toLocaleDateString('en-US', { weekday: 'long' }),
        date: sessionDate.toISOString().split('T')[0],
        timeSlot: timeSlots[index % timeSlots.length], // Use preferred time slots
        subject,
        topic: topic, // Use specific topic instead of fundamentals
        duration: Math.min(2, request.dailyHours), // Respect daily hours limit
        type: 'study',
        materials: [`${subject} textbook`, `${subject} notes`],
        notes: `Focus on ${topic}`, // Use specific topic in notes too
        completed: false
      })
    })
  }
  
  return sessions
}

function createFallbackFlashcards(request: StudyPlanRequest) {
  const flashcards: any[] = []
  let cardId = 1
  
  // If specific topics are provided, create flashcards for each topic
  if (request.specificTopics && request.specificTopics.length > 0) {
    const topics = request.specificTopics // Store in local variable for type safety
    topics.forEach((topic, topicIndex) => {
      // Create 3-5 flashcards per topic
      const cardsPerTopic = Math.min(5, Math.max(3, Math.floor(25 / topics.length)))
      
      for (let i = 0; i < cardsPerTopic; i++) {
        const difficulties = ['easy', 'medium', 'hard']
        const difficulty = difficulties[i % difficulties.length]
        
        flashcards.push({
          id: `flashcard_${cardId++}`,
          subject: request.subjects[0] || 'Study',
          question: `${topic}: ${getTopicQuestion(topic, difficulty)}`,
          answer: `${getTopicAnswer(topic, difficulty)}`,
          difficulty,
          tags: [topic.toLowerCase().replace(/\s+/g, '-'), difficulty, 'specific-topic']
        })
      }
    })
  } else {
    // Create flashcards for each subject
    request.subjects.forEach((subject) => {
      const cardsPerSubject = Math.floor(25 / request.subjects.length)
      
      for (let i = 0; i < cardsPerSubject; i++) {
        const difficulties = ['easy', 'medium', 'hard']
        const difficulty = difficulties[i % difficulties.length]
        
        flashcards.push({
          id: `flashcard_${cardId++}`,
          subject,
          question: `What are the ${difficulty} concepts in ${subject}?`,
          answer: `Review the ${difficulty} principles and core topics of ${subject}`,
          difficulty,
          tags: [subject.toLowerCase(), difficulty]
        })
      }
    })
  }
  
  return flashcards
}

function getTopicQuestion(topic: string, difficulty: string): string {
  const topicLower = topic.toLowerCase()
  
  if (topicLower.includes('quadratic')) {
    switch (difficulty) {
      case 'easy': return 'What is the standard form of a quadratic equation?'
      case 'medium': return 'How do you find the vertex of a quadratic function?'
      case 'hard': return 'Solve x² - 5x + 6 = 0 using the quadratic formula'
    }
  } else if (topicLower.includes('algebra')) {
    switch (difficulty) {
      case 'easy': return 'What is a variable in algebra?'
      case 'medium': return 'How do you solve linear equations?'
      case 'hard': return 'Simplify: (3x + 2)(2x - 1)'
    }
  } else if (topicLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy': return 'What is a derivative?'
      case 'medium': return 'Find the derivative of x²'
      case 'hard': return 'What is the chain rule?'
    }
  }
  
  // Generic questions for other topics
  switch (difficulty) {
    case 'easy': return `What is the basic definition of ${topic}?`
    case 'medium': return `Explain the main principles of ${topic}`
    case 'hard': return `Apply ${topic} to solve a complex problem`
    default: return `What are the key concepts in ${topic}?`
  }
}

function getTopicAnswer(topic: string, difficulty: string): string {
  const topicLower = topic.toLowerCase()
  
  if (topicLower.includes('quadratic')) {
    switch (difficulty) {
      case 'easy': return 'ax² + bx + c = 0, where a ≠ 0'
      case 'medium': return 'The vertex is at (-b/2a, f(-b/2a)) or use completing the square'
      case 'hard': return 'x = (5 ± √(25-24))/2 = (5 ± 1)/2, so x = 3 or x = 2'
    }
  } else if (topicLower.includes('algebra')) {
    switch (difficulty) {
      case 'easy': return 'A variable is a symbol (usually a letter) that represents an unknown number'
      case 'medium': return 'Isolate the variable by performing the same operations on both sides'
      case 'hard': return '6x² + 3x - 2x - 1 = 6x² + x - 1'
    }
  } else if (topicLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy': return 'The rate of change or slope of a function at a point'
      case 'medium': return 'd/dx(x²) = 2x'
      case 'hard': return 'If f(g(x)), then f\'(g(x)) × g\'(x)'
    }
  }
  
  // Generic answers for other topics
  switch (difficulty) {
    case 'easy': return `${topic} is a fundamental concept that involves...`
    case 'medium': return `The main principles of ${topic} include systematic approaches and key methodologies...`
    case 'hard': return `To apply ${topic} effectively, consider the complex relationships and advanced techniques...`
    default: return `Review the fundamental principles and core topics of ${topic}`
  }
}

// Types are now imported directly from './types' where needed