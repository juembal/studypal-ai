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
          onlineResources: generateOnlineResources(request.subjects, request.specificTopics, request.goals, request.studyLevel, request.difficulty),
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

    // Filter and auto-correct sessions to only include the original subjects (exclude breaks)
    const filteredSessions = studyPlanData.sessions ? studyPlanData.sessions
      .filter((session: any) => {
        if (!session.subject) return false
        // Exclude breaks from being counted as subjects
        if (session.subject.toLowerCase().includes('break') || 
            session.type === 'break' || 
            session.subject === 'Break') return false
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
    
    // Filter and auto-correct weekly schedule to only include original subjects (exclude breaks)
    const filteredWeeklySchedule: any = {}
    if (studyPlanData.weeklySchedule) {
      Object.entries(studyPlanData.weeklySchedule).forEach(([day, schedule]: [string, any]) => {
        if (schedule && schedule.subjects) {
          const filteredSubjects = schedule.subjects
            .filter((subjectInfo: any) => {
              if (!subjectInfo.subject) return false
              // Exclude breaks from being counted as subjects
              if (subjectInfo.subject.toLowerCase().includes('break') || 
                  subjectInfo.type === 'break' || 
                  subjectInfo.subject === 'Break') return false
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
    onlineResources: generateOnlineResources(request.subjects, request.specificTopics, request.goals, request.studyLevel, request.difficulty),
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

function generateOnlineResources(subjects: string[], specificTopics?: string[], goals?: string, studyLevel?: string, difficulty?: string) {
  const selectedResources: any[] = []
  
  // Enhanced resource templates with more specific and accurate resources
  const resourceTemplates = {
    math: {
      general: [
        {
          title: 'Khan Academy: Mathematics',
          url: 'https://www.khanacademy.org/math',
          type: 'video',
          topic: 'Comprehensive math curriculum',
          description: 'Free interactive math lessons from arithmetic to calculus with practice exercises and instant feedback',
          difficulty: 'beginner',
          estimatedTime: '20-45 minutes per lesson',
          isFree: true
        },
        {
          title: 'Wolfram Alpha',
          url: 'https://www.wolframalpha.com',
          type: 'tool',
          topic: 'Mathematical computation',
          description: 'Computational knowledge engine for solving equations, graphing functions, and step-by-step solutions',
          difficulty: 'intermediate',
          estimatedTime: '5-15 minutes per problem',
          isFree: true
        }
      ],
      algebra: [
        {
          title: 'Khan Academy: Algebra Basics',
          url: 'https://www.khanacademy.org/math/algebra-basics',
          type: 'video',
          topic: 'Algebra fundamentals',
          description: 'Complete algebra course covering variables, equations, graphing, and systems of equations',
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes per topic',
          isFree: true
        },
        {
          title: 'IXL Math: Algebra Practice',
          url: 'https://www.ixl.com/math/algebra-1',
          type: 'practice',
          topic: 'Algebra problem solving',
          description: 'Adaptive algebra practice with detailed explanations and progress tracking',
          difficulty: 'intermediate',
          estimatedTime: '15-30 minutes',
          isFree: false
        }
      ],
      calculus: [
        {
          title: 'Khan Academy: Calculus',
          url: 'https://www.khanacademy.org/math/calculus-1',
          type: 'video',
          topic: 'Differential and integral calculus',
          description: 'Complete calculus course covering limits, derivatives, integrals, and applications',
          difficulty: 'advanced',
          estimatedTime: '45-90 minutes per lesson',
          isFree: true
        },
        {
          title: 'MIT OpenCourseWare: Single Variable Calculus',
          url: 'https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/',
          type: 'course',
          topic: 'University-level calculus',
          description: 'Complete MIT calculus course with video lectures, assignments, and exams',
          difficulty: 'advanced',
          estimatedTime: '3-5 hours per week',
          isFree: true
        }
      ],
      quadratic: [
        {
          title: 'Khan Academy: Quadratic Functions',
          url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations',
          type: 'video',
          topic: 'Quadratic equations and functions',
          description: 'Comprehensive coverage of quadratic equations, graphing parabolas, and solving methods',
          difficulty: 'intermediate',
          estimatedTime: '30-45 minutes per lesson',
          isFree: true
        }
      ]
    },
    physics: {
      general: [
        {
          title: 'Khan Academy: Physics',
          url: 'https://www.khanacademy.org/science/physics',
          type: 'video',
          topic: 'Physics fundamentals',
          description: 'Interactive physics lessons covering mechanics, waves, thermodynamics, and modern physics',
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes per lesson',
          isFree: true
        },
        {
          title: 'PhET Interactive Simulations',
          url: 'https://phet.colorado.edu/en/simulations/filter?subjects=physics',
          type: 'simulation',
          topic: 'Physics simulations',
          description: 'Interactive physics simulations for visualizing concepts in mechanics, electricity, and quantum physics',
          difficulty: 'intermediate',
          estimatedTime: '15-30 minutes per simulation',
          isFree: true
        }
      ],
      mechanics: [
        {
          title: 'MIT OpenCourseWare: Classical Mechanics',
          url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/',
          type: 'course',
          topic: 'Classical mechanics',
          description: 'Complete MIT physics course covering motion, forces, energy, and momentum',
          difficulty: 'advanced',
          estimatedTime: '4-6 hours per week',
          isFree: true
        }
      ]
    },
    chemistry: {
      general: [
        {
          title: 'Khan Academy: Chemistry',
          url: 'https://www.khanacademy.org/science/chemistry',
          type: 'video',
          topic: 'Chemistry fundamentals',
          description: 'Complete chemistry course covering atoms, bonds, reactions, and stoichiometry',
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes per lesson',
          isFree: true
        },
        {
          title: 'ChemCollective Virtual Labs',
          url: 'http://chemcollective.org/vlabs',
          type: 'simulation',
          topic: 'Virtual chemistry experiments',
          description: 'Virtual chemistry laboratory with realistic simulations and guided activities',
          difficulty: 'intermediate',
          estimatedTime: '45-90 minutes per lab',
          isFree: true
        }
      ],
      organic: [
        {
          title: 'Khan Academy: Organic Chemistry',
          url: 'https://www.khanacademy.org/science/organic-chemistry',
          type: 'video',
          topic: 'Organic chemistry',
          description: 'Comprehensive organic chemistry covering structure, reactions, and mechanisms',
          difficulty: 'advanced',
          estimatedTime: '45-75 minutes per lesson',
          isFree: true
        }
      ]
    },
    biology: {
      general: [
        {
          title: 'Khan Academy: Biology',
          url: 'https://www.khanacademy.org/science/biology',
          type: 'video',
          topic: 'Biology fundamentals',
          description: 'Complete biology course covering cells, genetics, evolution, and ecology',
          difficulty: 'beginner',
          estimatedTime: '30-60 minutes per lesson',
          isFree: true
        },
        {
          title: 'BioInteractive',
          url: 'https://www.biointeractive.org',
          type: 'interactive',
          topic: 'Biology resources and simulations',
          description: 'HHMI interactive biology resources with animations, virtual labs, and case studies',
          difficulty: 'intermediate',
          estimatedTime: '20-45 minutes per activity',
          isFree: true
        }
      ],
      molecular: [
        {
          title: 'MIT OpenCourseWare: Molecular Biology',
          url: 'https://ocw.mit.edu/courses/7-28-molecular-biology-spring-2005/',
          type: 'course',
          topic: 'Molecular biology',
          description: 'Advanced molecular biology course covering DNA, RNA, proteins, and gene regulation',
          difficulty: 'advanced',
          estimatedTime: '4-6 hours per week',
          isFree: true
        }
      ]
    },
    history: {
      general: [
        {
          title: 'Khan Academy: World History',
          url: 'https://www.khanacademy.org/humanities/world-history',
          type: 'video',
          topic: 'World history',
          description: 'Comprehensive world history from ancient civilizations to modern times',
          difficulty: 'beginner',
          estimatedTime: '20-40 minutes per lesson',
          isFree: true
        },
        {
          title: 'Crash Course World History',
          url: 'https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9',
          type: 'video',
          topic: 'World history overview',
          description: 'Engaging 10-15 minute videos covering major historical events and themes',
          difficulty: 'beginner',
          estimatedTime: '10-15 minutes per video',
          isFree: true
        }
      ]
    },
    english: {
      general: [
        {
          title: 'Khan Academy: Grammar',
          url: 'https://www.khanacademy.org/humanities/grammar',
          type: 'video',
          topic: 'English grammar and usage',
          description: 'Complete grammar course covering parts of speech, sentence structure, and writing mechanics',
          difficulty: 'beginner',
          estimatedTime: '15-30 minutes per lesson',
          isFree: true
        },
        {
          title: 'Purdue OWL Writing Lab',
          url: 'https://owl.purdue.edu/owl/purdue_owl.html',
          type: 'resource',
          topic: 'Writing and research',
          description: 'Comprehensive writing resources covering grammar, style, citation, and research methods',
          difficulty: 'intermediate',
          estimatedTime: '10-30 minutes per topic',
          isFree: true
        }
      ]
    }
  }
  
  // General high-quality resources that work for any subject
  const universalResources = [
    {
      title: 'Coursera: Learning How to Learn',
      url: 'https://www.coursera.org/learn/learning-how-to-learn',
      type: 'course',
      subject: 'Study Skills',
      topic: 'Effective learning techniques',
      description: 'Evidence-based learning techniques for mastering tough subjects, taught by UC San Diego',
      difficulty: 'beginner',
      estimatedTime: '4 weeks (2-4 hours/week)',
      isFree: true
    },
    {
      title: 'Quizlet',
      url: 'https://quizlet.com',
      type: 'tool',
      subject: 'Study Tools',
      topic: 'Flashcards and study games',
      description: 'Create and study flashcards, take practice tests, and play learning games',
      difficulty: 'all',
      estimatedTime: '10-30 minutes per session',
      isFree: true
    }
  ]
  
  // Enhanced topic-specific resource matching
  const getTopicSpecificResources = (topic: string, subject: string) => {
    const topicLower = topic.toLowerCase()
    const subjectLower = subject.toLowerCase()
    
    // Math-specific topic resources
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
      if (topicLower.includes('quadratic') || topicLower.includes('parabola')) {
        return [{
          title: 'Khan Academy: Quadratic Functions & Equations',
          url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations',
          type: 'video',
          subject,
          topic: 'Quadratic equations and parabolas',
          description: 'Complete guide to solving quadratic equations, graphing parabolas, and understanding vertex form',
          difficulty: 'intermediate',
          estimatedTime: '30-45 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('linear') || topicLower.includes('slope')) {
        return [{
          title: 'Khan Academy: Linear Functions',
          url: 'https://www.khanacademy.org/math/algebra-basics/alg-basics-graphing-lines-and-slope',
          type: 'video',
          subject,
          topic: 'Linear equations and slope',
          description: 'Master linear equations, slope-intercept form, and graphing lines',
          difficulty: 'beginner',
          estimatedTime: '25-40 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('derivative') || topicLower.includes('differentiation')) {
        return [{
          title: 'Khan Academy: Derivatives Introduction',
          url: 'https://www.khanacademy.org/math/calculus-1/cs1-derivatives-definition-and-basic-rules',
          type: 'video',
          subject,
          topic: 'Derivatives and differentiation',
          description: 'Learn derivatives, differentiation rules, and applications to real-world problems',
          difficulty: 'advanced',
          estimatedTime: '45-60 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('integral') || topicLower.includes('integration')) {
        return [{
          title: 'Khan Academy: Integrals',
          url: 'https://www.khanacademy.org/math/calculus-1/cs1-integrals-definition-and-basic-rules',
          type: 'video',
          subject,
          topic: 'Integration and antiderivatives',
          description: 'Master integration techniques, fundamental theorem of calculus, and area calculations',
          difficulty: 'advanced',
          estimatedTime: '50-75 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('polynomial') || topicLower.includes('factor')) {
        return [{
          title: 'Khan Academy: Polynomial Factorization',
          url: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:poly-factor',
          type: 'video',
          subject,
          topic: 'Polynomial operations and factoring',
          description: 'Learn to factor polynomials, solve polynomial equations, and understand polynomial behavior',
          difficulty: 'intermediate',
          estimatedTime: '35-50 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('trigonometry') || topicLower.includes('trig')) {
        return [{
          title: 'Khan Academy: Trigonometry',
          url: 'https://www.khanacademy.org/math/trigonometry',
          type: 'video',
          subject,
          topic: 'Trigonometric functions and identities',
          description: 'Complete trigonometry course covering sine, cosine, tangent, and trigonometric identities',
          difficulty: 'intermediate',
          estimatedTime: '40-60 minutes per lesson',
          isFree: true
        }]
      }
    }
    
    // Physics-specific topic resources
    else if (subjectLower.includes('physics')) {
      if (topicLower.includes('mechanic') || topicLower.includes('motion') || topicLower.includes('force')) {
        return [{
          title: 'Khan Academy: Forces and Newton\'s Laws',
          url: 'https://www.khanacademy.org/science/physics/forces-newtons-laws',
          type: 'video',
          subject,
          topic: 'Classical mechanics and forces',
          description: 'Master Newton\'s laws, force analysis, friction, and motion in one and two dimensions',
          difficulty: 'intermediate',
          estimatedTime: '35-55 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('electric') || topicLower.includes('circuit')) {
        return [{
          title: 'Khan Academy: Circuits',
          url: 'https://www.khanacademy.org/science/physics/circuits-topic',
          type: 'video',
          subject,
          topic: 'Electric circuits and current',
          description: 'Learn about electric current, voltage, resistance, and circuit analysis',
          difficulty: 'intermediate',
          estimatedTime: '40-60 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('wave') || topicLower.includes('sound') || topicLower.includes('light')) {
        return [{
          title: 'Khan Academy: Waves and Sound',
          url: 'https://www.khanacademy.org/science/physics/mechanical-waves-and-sound',
          type: 'video',
          subject,
          topic: 'Waves, sound, and optics',
          description: 'Understand wave properties, sound waves, interference, and basic optics',
          difficulty: 'intermediate',
          estimatedTime: '30-50 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('energy') || topicLower.includes('work')) {
        return [{
          title: 'Khan Academy: Work and Energy',
          url: 'https://www.khanacademy.org/science/physics/work-and-energy',
          type: 'video',
          subject,
          topic: 'Work, energy, and power',
          description: 'Master concepts of work, kinetic energy, potential energy, and conservation of energy',
          difficulty: 'intermediate',
          estimatedTime: '35-55 minutes per lesson',
          isFree: true
        }]
      }
    }
    
    // Chemistry-specific topic resources
    else if (subjectLower.includes('chemistry')) {
      if (topicLower.includes('organic') || topicLower.includes('carbon')) {
        return [{
          title: 'Khan Academy: Organic Chemistry',
          url: 'https://www.khanacademy.org/science/organic-chemistry',
          type: 'video',
          subject,
          topic: 'Organic chemistry fundamentals',
          description: 'Learn organic molecule structure, nomenclature, reactions, and mechanisms',
          difficulty: 'advanced',
          estimatedTime: '45-75 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('acid') || topicLower.includes('base') || topicLower.includes('ph')) {
        return [{
          title: 'Khan Academy: Acids and Bases',
          url: 'https://www.khanacademy.org/science/chemistry/acids-and-bases-topic',
          type: 'video',
          subject,
          topic: 'Acids, bases, and pH',
          description: 'Understand acid-base reactions, pH calculations, and buffer systems',
          difficulty: 'intermediate',
          estimatedTime: '30-50 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('bond') || topicLower.includes('molecular')) {
        return [{
          title: 'Khan Academy: Chemical Bonds',
          url: 'https://www.khanacademy.org/science/chemistry/chemical-bonds',
          type: 'video',
          subject,
          topic: 'Chemical bonding and molecular structure',
          description: 'Learn about ionic bonds, covalent bonds, and molecular geometry',
          difficulty: 'intermediate',
          estimatedTime: '35-55 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('stoichiometry') || topicLower.includes('mole')) {
        return [{
          title: 'Khan Academy: Stoichiometry',
          url: 'https://www.khanacademy.org/science/chemistry/chemical-reactions-stoichiometry',
          type: 'video',
          subject,
          topic: 'Stoichiometry and chemical calculations',
          description: 'Master mole calculations, limiting reagents, and chemical equation balancing',
          difficulty: 'intermediate',
          estimatedTime: '40-60 minutes per lesson',
          isFree: true
        }]
      }
    }
    
    // Biology-specific topic resources
    else if (subjectLower.includes('biology')) {
      if (topicLower.includes('cell') || topicLower.includes('cellular')) {
        return [{
          title: 'Khan Academy: Cell Structure and Function',
          url: 'https://www.khanacademy.org/science/biology/structure-of-a-cell',
          type: 'video',
          subject,
          topic: 'Cell biology and organelles',
          description: 'Learn about cell structure, organelles, membrane transport, and cellular processes',
          difficulty: 'intermediate',
          estimatedTime: '30-50 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('dna') || topicLower.includes('genetic') || topicLower.includes('gene')) {
        return [{
          title: 'Khan Academy: DNA and Gene Expression',
          url: 'https://www.khanacademy.org/science/biology/gene-expression-central-dogma',
          type: 'video',
          subject,
          topic: 'Genetics and molecular biology',
          description: 'Understand DNA structure, replication, transcription, translation, and gene regulation',
          difficulty: 'advanced',
          estimatedTime: '40-65 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('evolution') || topicLower.includes('natural selection')) {
        return [{
          title: 'Khan Academy: Evolution and Natural Selection',
          url: 'https://www.khanacademy.org/science/biology/her/evolution-and-natural-selection',
          type: 'video',
          subject,
          topic: 'Evolution and natural selection',
          description: 'Learn about evolutionary theory, natural selection, and evidence for evolution',
          difficulty: 'intermediate',
          estimatedTime: '35-55 minutes per lesson',
          isFree: true
        }]
      } else if (topicLower.includes('ecology') || topicLower.includes('ecosystem')) {
        return [{
          title: 'Khan Academy: Ecology',
          url: 'https://www.khanacademy.org/science/biology/ecology',
          type: 'video',
          subject,
          topic: 'Ecology and ecosystems',
          description: 'Study population dynamics, community interactions, and ecosystem energy flow',
          difficulty: 'intermediate',
          estimatedTime: '30-50 minutes per lesson',
          isFree: true
        }]
      }
    }
    
    return [] // Return empty if no specific match found
  }

  // Generate resources based on subjects and specific topics
  subjects.forEach(subject => {
    const subjectLower = subject.toLowerCase()
    let subjectResources: any[] = []
    
    // First, try to get topic-specific resources
    if (specificTopics && specificTopics.length > 0) {
      specificTopics.forEach(topic => {
        const topicResources = getTopicSpecificResources(topic, subject)
        subjectResources.push(...topicResources)
      })
    }
    
    // If no topic-specific resources found, use subject-based resources
    if (subjectResources.length === 0) {
      if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
        subjectResources.push(...resourceTemplates.math.general.map(r => ({ ...r, subject })))
      } else if (subjectLower.includes('physics')) {
        subjectResources.push(...resourceTemplates.physics.general.map(r => ({ ...r, subject })))
      } else if (subjectLower.includes('chemistry')) {
        subjectResources.push(...resourceTemplates.chemistry.general.map(r => ({ ...r, subject })))
      } else if (subjectLower.includes('biology')) {
        subjectResources.push(...resourceTemplates.biology.general.map(r => ({ ...r, subject })))
      } else if (subjectLower.includes('history')) {
        subjectResources.push(...resourceTemplates.history.general.map(r => ({ ...r, subject })))
      } else if (subjectLower.includes('english') || subjectLower.includes('literature')) {
        subjectResources.push(...resourceTemplates.english.general.map(r => ({ ...r, subject })))
      } else {
        // Generic fallback for other subjects
        subjectResources.push({
          title: `Khan Academy: ${subject}`,
          url: `https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(subject)}`,
          type: 'video',
          subject,
          topic: `${subject} fundamentals`,
          description: `Educational videos and practice exercises for ${subject}`,
          difficulty: 'beginner',
          estimatedTime: '20-45 minutes per lesson',
          isFree: true
        })
      }
    }
    
    // Add the best 1-2 resources per subject to avoid overcrowding
    selectedResources.push(...subjectResources.slice(0, 2))
  })
  
  // Determine final count (3-5 resources based on number of subjects)
  const targetCount = Math.min(5, Math.max(3, subjects.length + 1))
  
  // Fill remaining slots with universal resources if needed
  const remainingSlots = Math.max(0, targetCount - selectedResources.length)
  if (remainingSlots > 0) {
    selectedResources.push(...universalResources.slice(0, remainingSlots))
  }
  
  // Return 3-5 resources total
  return selectedResources.slice(0, targetCount)
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
   - For ${request.dailyHours} daily hours: Create ${Math.ceil(request.dailyHours / 1.5)} sessions that add up to EXACTLY ${request.dailyHours} hours
   - Session durations should be calculated to total exactly ${request.dailyHours} hours (e.g., for 4 hours: 1.33 + 1.33 + 1.34 = 4.0 hours)
   - Break longer study periods with different subjects or session types
   - Alternate between intensive and lighter subjects within the same day
5. ${request.includeWeekends === 'weekdays' ? 'Schedule ONLY Monday through Friday (5 days per week)' : request.includeWeekends === 'all' ? 'Include all 7 days of the week' : 'Use 5-6 days per week as needed'}
6. Session Duration Rules:
   - Individual sessions: 1-1.5 hours maximum (optimal for focus and retention)
   - Minimum session: 30 minutes (anything shorter is ineffective)
   - NO sessions longer than 1.5 hours (causes fatigue and poor retention)
7. **CRITICAL**: Total daily hours MUST EXACTLY equal ${request.dailyHours} hours (not more, not less)
   - Calculate session durations precisely so they add up to ${request.dailyHours}
   - Example for ${request.dailyHours} hours: distribute as ${request.dailyHours <= 2 ? `${request.dailyHours} hour session` : request.dailyHours === 3 ? '1.5 + 1.5 = 3.0 hours' : request.dailyHours === 4 ? '1.33 + 1.33 + 1.34 = 4.0 hours' : `sessions that total exactly ${request.dailyHours} hours`}
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
- flashcards: **CRITICAL** - Generate EXACTLY 10 flashcards covering ALL specified topics:
  ${request.specificTopics && request.specificTopics.length > 0 ? `
  * Create 2-3 flashcards for EACH topic: ${request.specificTopics.join(', ')}
  * Ensure balanced coverage - do NOT focus on just one topic
  * Include questions about definitions, formulas, examples, and applications
  * Mix difficulty levels: easy, medium, hard for each topic` : '* Cover key concepts from all subjects with varied difficulty levels'}
- onlineResources: **CRITICAL** - Generate 3-5 high-quality resources total (not per subject):
  * Select the BEST resources that match the subjects: ${request.subjects.join(', ')}
  * For specific topics like "${request.specificTopics?.join(', ') || 'general coverage'}", include topic-specific resources
  * Prioritize: Khan Academy, MIT OCW, Coursera, subject-specific tools, and interactive resources
  * Include variety: videos, interactive tools, courses, simulations, practice platforms
  * Mix difficulty levels: beginner, intermediate, advanced
  * Include both free and premium options
  * Quality over quantity - each resource should be highly relevant and valuable

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
  // Calculate actual session duration to match total daily hours exactly
  const baseSessionDuration = request.dailyHours / sessionsPerDay
  
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
      const remainingSessions = targetSessions - i
      
      // Calculate duration to ensure exact total
      let duration: number
      if (remainingSessions === 1) {
        // Last session gets all remaining hours
        duration = remainingHours
      } else {
        // Use base duration but ensure we don't exceed limits
        duration = Math.min(1.5, Math.max(0.5, remainingHours / remainingSessions))
      }
      
      // Ensure duration doesn't exceed remaining hours
      duration = Math.min(duration, remainingHours)
      
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
        
        // Round duration to nearest 0.25 for better precision
        const roundedDuration = Math.round(duration * 4) / 4
        
        schedule[day].subjects.push({
          subject,
          duration: roundedDuration,
          timeSlot,
          focus: focus,
          priority: sessionCount === 0 ? 'high' : sessionCount === 1 ? 'medium' : 'low',
          type: sessionType
        })
        
        // Add break between sessions (except for the last session of the day)
        // Note: Breaks are handled separately and not counted as subjects
        
        dailyHours += roundedDuration
        sessionCount++
        globalSubjectIndex++ // Increment for next session
      }
    }
    
    // Ensure total hours exactly matches the requested daily hours
    schedule[day].totalHours = Math.round(dailyHours * 4) / 4 // Round to nearest 0.25
    
    // If there's a small discrepancy, adjust the last session
    const difference = request.dailyHours - schedule[day].totalHours
    if (Math.abs(difference) > 0.01 && schedule[day].subjects.length > 0) {
      const lastSession = schedule[day].subjects[schedule[day].subjects.length - 1]
      lastSession.duration = Math.round((lastSession.duration + difference) * 4) / 4
      schedule[day].totalHours = request.dailyHours
    }
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
        if (subjectInfo.subject !== 'Break' && 
            !subjectInfo.subject.toLowerCase().includes('break') && 
            subjectInfo.type !== 'break') {
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
  
  // Generate exactly 10 flashcards total
  const maxCards = 10
  
  // Track used questions to prevent duplicates
  const usedQuestions = new Set<string>()
  
  // If specific topics are provided, create flashcards for each topic
  if (request.specificTopics && request.specificTopics.length > 0) {
    const topics = request.specificTopics // Store in local variable for type safety
    const cardsPerTopic = Math.floor(maxCards / topics.length)
    const remainingCards = maxCards % topics.length
    
    topics.forEach((topic, topicIndex) => {
      // Distribute cards evenly, with remainder going to first topics
      const cardsForThisTopic = cardsPerTopic + (topicIndex < remainingCards ? 1 : 0)
      
      // Find the best matching subject for this topic
      const matchingSubject = request.subjects.find(subject => {
        const subjectLower = subject.toLowerCase()
        const topicLower = topic.toLowerCase()
        return topicLower.includes(subjectLower) || 
               subjectLower.includes(topicLower) ||
               (subjectLower.includes('math') && (topicLower.includes('equation') || topicLower.includes('algebra') || topicLower.includes('calculus'))) ||
               (subjectLower.includes('science') && (topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology')))
      }) || request.subjects[0] || 'Study'
      
      // Generate unique flashcards for this topic
      let attempts = 0
      for (let i = 0; i < cardsForThisTopic && flashcards.length < maxCards && attempts < 20; attempts++) {
        const difficulties = ['easy', 'medium', 'hard']
        const difficulty = difficulties[i % difficulties.length]
        
        const { question, answer } = generateUniqueTopicFlashcard(topic, difficulty, i, topicIndex, usedQuestions)
        
        // Check if this question is unique
        if (!usedQuestions.has(question.toLowerCase())) {
          usedQuestions.add(question.toLowerCase())
          
          flashcards.push({
            id: `flashcard_${cardId++}`,
            subject: matchingSubject,
            question: question,
            answer: answer,
            difficulty,
            tags: [topic.toLowerCase().replace(/\s+/g, '-'), difficulty, 'specific-topic', matchingSubject.toLowerCase()]
          })
          i++ // Only increment when we successfully add a card
        }
      }
    })
  } else {
    // Create flashcards for each subject with better distribution
    const cardsPerSubject = Math.floor(maxCards / request.subjects.length)
    const remainingCards = maxCards % request.subjects.length
    
    request.subjects.forEach((subject, subjectIndex) => {
      const cardsForThisSubject = cardsPerSubject + (subjectIndex < remainingCards ? 1 : 0)
      
      // Generate unique flashcards for this subject
      let attempts = 0
      for (let i = 0; i < cardsForThisSubject && flashcards.length < maxCards && attempts < 20; attempts++) {
        const difficulties = ['easy', 'medium', 'hard']
        const difficulty = difficulties[i % difficulties.length]
        
        const { question, answer } = generateUniqueSubjectFlashcard(subject, difficulty, i, subjectIndex, usedQuestions)
        
        // Check if this question is unique
        if (!usedQuestions.has(question.toLowerCase())) {
          usedQuestions.add(question.toLowerCase())
          
          flashcards.push({
            id: `flashcard_${cardId++}`,
            subject,
            question,
            answer,
            difficulty,
            tags: [subject.toLowerCase().replace(/\s+/g, '-'), difficulty]
          })
          i++ // Only increment when we successfully add a card
        }
      }
    })
  }
  
  return flashcards.slice(0, maxCards) // Ensure exactly 10 cards
}

// Helper function to generate unique topic-specific flashcards
function generateUniqueTopicFlashcard(topic: string, difficulty: string, cardIndex: number, topicIndex: number, usedQuestions: Set<string>): { question: string, answer: string } {
  const topicLower = topic.toLowerCase()
  
  // Create comprehensive question pools for each topic and difficulty
  const questionPools = getTopicQuestionPools(topic, difficulty)
  
  // Try to find a unique question from the pool
  for (let i = 0; i < questionPools.length; i++) {
    const poolIndex = (cardIndex + topicIndex + i) % questionPools.length
    const questionData = questionPools[poolIndex]
    
    if (!usedQuestions.has(questionData.question.toLowerCase())) {
      return questionData
    }
  }
  
  // Fallback: generate a unique question with index suffix if all pool questions are used
  const fallback = questionPools[0] || { 
    question: `What are the key concepts of ${topic}?`, 
    answer: `${topic} involves fundamental principles and applications that are essential for understanding this subject area.` 
  }
  
  return {
    question: `${fallback.question} (Part ${cardIndex + 1})`,
    answer: fallback.answer
  }
}

// Helper function to generate unique subject-specific flashcards
function generateUniqueSubjectFlashcard(subject: string, difficulty: string, cardIndex: number, subjectIndex: number, usedQuestions: Set<string>): { question: string, answer: string } {
  const subjectLower = subject.toLowerCase()
  
  // Create comprehensive question pools for each subject and difficulty
  const questionPools = getSubjectQuestionPools(subject, difficulty)
  
  // Try to find a unique question from the pool
  for (let i = 0; i < questionPools.length; i++) {
    const poolIndex = (cardIndex + subjectIndex + i) % questionPools.length
    const questionData = questionPools[poolIndex]
    
    if (!usedQuestions.has(questionData.question.toLowerCase())) {
      return questionData
    }
  }
  
  // Fallback: generate a unique question with index suffix if all pool questions are used
  const fallback = questionPools[0] || { 
    question: `What are the fundamentals of ${subject}?`, 
    answer: `${subject} involves core concepts and principles that form the foundation for advanced study in this field.` 
  }
  
  return {
    question: `${fallback.question} (Aspect ${cardIndex + 1})`,
    answer: fallback.answer
  }
}

// Function to get comprehensive question pools for topics
function getTopicQuestionPools(topic: string, difficulty: string): Array<{ question: string, answer: string }> {
  const topicLower = topic.toLowerCase()
  
  if (topicLower.includes('quadratic')) {
    switch (difficulty) {
      case 'easy':
        return [
          { question: 'What is a quadratic equation?', answer: 'A quadratic equation is a polynomial equation of degree 2, written in the form ax² + bx + c = 0, where a ≠ 0. The graph of a quadratic function is a parabola.' },
          { question: 'What is the standard form of a quadratic equation?', answer: 'The standard form is ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0. This form makes it easy to identify the coefficients for solving.' },
          { question: 'What does the coefficient "a" determine in a quadratic equation?', answer: 'The coefficient "a" determines the direction and width of the parabola. If a > 0, the parabola opens upward; if a < 0, it opens downward. Larger |a| values make the parabola narrower.' },
          { question: 'What is the axis of symmetry in a quadratic function?', answer: 'The axis of symmetry is a vertical line that passes through the vertex of the parabola, given by x = -b/(2a). The parabola is symmetric about this line.' }
        ]
      case 'medium':
        return [
          { question: 'How do you find the vertex of a quadratic function y = ax² + bx + c?', answer: 'The vertex is at x = -b/(2a). Substitute this x-value back into the equation to find the y-coordinate. The vertex form is y = a(x - h)² + k where (h,k) is the vertex.' },
          { question: 'What is the discriminant and what does it tell us?', answer: 'The discriminant is b² - 4ac. If positive, there are 2 real roots; if zero, 1 real root; if negative, no real roots (2 complex roots).' },
          { question: 'How do you complete the square for x² + 6x + 5?', answer: 'Take half of the coefficient of x (6/2 = 3), square it (9), then rewrite: x² + 6x + 9 - 9 + 5 = (x + 3)² - 4.' },
          { question: 'What are the x-intercepts of a quadratic function?', answer: 'The x-intercepts are the points where the parabola crosses the x-axis (where y = 0). They are found by solving ax² + bx + c = 0.' }
        ]
      case 'hard':
        return [
          { question: 'Solve x² - 5x + 6 = 0 using factoring and the quadratic formula', answer: 'Factoring: (x - 2)(x - 3) = 0, so x = 2 or x = 3. Quadratic formula: x = (5 ± √(25-24))/2 = (5 ± 1)/2, giving x = 3 or x = 2.' },
          { question: 'Find the range of f(x) = 2x² - 8x + 3', answer: 'Complete the square: f(x) = 2(x² - 4x) + 3 = 2(x - 2)² - 8 + 3 = 2(x - 2)² - 5. Since a = 2 > 0, the parabola opens upward with vertex at (2, -5). Range: [-5, ∞).' },
          { question: 'Solve the quadratic inequality x² - 3x - 4 > 0', answer: 'Factor: (x - 4)(x + 1) > 0. The roots are x = 4 and x = -1. Test intervals: x < -1 (positive), -1 < x < 4 (negative), x > 4 (positive). Solution: x < -1 or x > 4.' },
          { question: 'Find the quadratic function with vertex (2, -3) passing through (0, 1)', answer: 'Use vertex form: f(x) = a(x - 2)² - 3. Substitute (0, 1): 1 = a(0 - 2)² - 3 → 1 = 4a - 3 → a = 1. So f(x) = (x - 2)² - 3 = x² - 4x + 1.' }
        ]
    }
  } else if (topicLower.includes('algebra')) {
    switch (difficulty) {
      case 'easy':
        return [
          { question: 'What is algebra?', answer: 'Algebra is a branch of mathematics that uses symbols (usually letters) to represent unknown numbers or variables in equations and expressions.' },
          { question: 'What is a variable in algebra?', answer: 'A variable is a symbol (like x, y, or z) that represents an unknown value that can change. Variables allow us to write general mathematical relationships.' },
          { question: 'What is an algebraic expression?', answer: 'An algebraic expression is a mathematical phrase that contains numbers, variables, and operation symbols, but no equals sign. Examples: 3x + 5, 2y - 7.' },
          { question: 'What is the difference between an expression and an equation?', answer: 'An expression is a mathematical phrase without an equals sign (like 3x + 5), while an equation has an equals sign showing that two expressions are equal (like 3x + 5 = 14).' }
        ]
      case 'medium':
        return [
          { question: 'How do you solve the equation 3x + 7 = 22?', answer: 'Subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5. Check: 3(5) + 7 = 15 + 7 = 22 ✓' },
          { question: 'What are like terms and how do you combine them?', answer: 'Like terms have the same variables with the same exponents. Combine by adding/subtracting coefficients: 3x + 5x = 8x, but 3x + 5y cannot be simplified.' },
          { question: 'How do you distribute 3(x + 4)?', answer: 'Multiply 3 by each term inside the parentheses: 3(x + 4) = 3·x + 3·4 = 3x + 12. This is the distributive property.' },
          { question: 'Solve for x: 2x - 5 = x + 3', answer: 'Subtract x from both sides: x - 5 = 3. Add 5 to both sides: x = 8. Check: 2(8) - 5 = 16 - 5 = 11, and 8 + 3 = 11 ✓' }
        ]
      case 'hard':
        return [
          { question: 'Solve the system: 2x + 3y = 12 and x - y = 1', answer: 'From equation 2: x = y + 1. Substitute into equation 1: 2(y + 1) + 3y = 12 → 2y + 2 + 3y = 12 → 5y = 10 → y = 2. Then x = 3. Solution: (3, 2)' },
          { question: 'Factor completely: x³ - 8', answer: 'This is a difference of cubes: x³ - 2³ = (x - 2)(x² + 2x + 4). The formula is a³ - b³ = (a - b)(a² + ab + b²).' },
          { question: 'Solve the inequality 2x - 3 < 5x + 6', answer: 'Subtract 2x from both sides: -3 < 3x + 6. Subtract 6 from both sides: -9 < 3x. Divide by 3: -3 < x, or x > -3.' },
          { question: 'Simplify: (x² - 4)/(x + 2)', answer: 'Factor the numerator: (x - 2)(x + 2)/(x + 2). Cancel common factors: x - 2 (provided x ≠ -2).' }
        ]
    }
  } else if (topicLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy':
        return [
          { question: 'What is calculus?', answer: 'Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (derivatives/rates of change) and integral calculus (areas/accumulation).' },
          { question: 'What is a derivative?', answer: 'A derivative represents the instantaneous rate of change of a function at a point. Geometrically, it\'s the slope of the tangent line to the curve at that point.' },
          { question: 'What is a limit in calculus?', answer: 'A limit describes the value that a function approaches as the input approaches a certain value. It\'s the foundation for defining derivatives and integrals.' },
          { question: 'What does it mean for a function to be continuous?', answer: 'A function is continuous at a point if there are no breaks, holes, or jumps at that point. The limit exists and equals the function value.' }
        ]
      case 'medium':
        return [
          { question: 'Find the derivative of f(x) = x³ + 2x² - 5x + 1', answer: 'Using the power rule: f\'(x) = 3x² + 4x - 5. The power rule states that d/dx(xⁿ) = nxⁿ⁻¹.' },
          { question: 'What is the chain rule?', answer: 'If f(g(x)) is a composite function, then its derivative is f\'(g(x)) × g\'(x). Used when you have a function inside another function.' },
          { question: 'Find the derivative of sin(x)', answer: 'The derivative of sin(x) is cos(x). This is one of the basic trigonometric derivatives.' },
          { question: 'What is the product rule for derivatives?', answer: 'If f(x) = u(x)·v(x), then f\'(x) = u\'(x)·v(x) + u(x)·v\'(x). The derivative of a product is not the product of derivatives.' }
        ]
      case 'hard':
        return [
          { question: 'Find the derivative of y = ln(sin(x²))', answer: 'Using chain rule: dy/dx = (1/sin(x²)) × cos(x²) × 2x = (2x cos(x²))/sin(x²) = 2x cot(x²)' },
          { question: 'Evaluate the limit: lim(x→0) (sin(x)/x)', answer: 'This is a fundamental limit that equals 1. It can be proven using the squeeze theorem or L\'Hôpital\'s rule.' },
          { question: 'Find the critical points of f(x) = x³ - 3x² + 2', answer: 'f\'(x) = 3x² - 6x = 3x(x - 2). Critical points occur when f\'(x) = 0, so x = 0 and x = 2.' },
          { question: 'Use implicit differentiation to find dy/dx for x² + y² = 25', answer: 'Differentiate both sides: 2x + 2y(dy/dx) = 0. Solve for dy/dx: dy/dx = -x/y.' }
        ]
    }
  }
  
  // Generic topic handling with more variety
  const genericQuestions = [
    { question: `What are the fundamental concepts of ${topic}?`, answer: `${topic} involves core principles, definitions, and basic applications that form the foundation for advanced study.` },
    { question: `How is ${topic} applied in real-world situations?`, answer: `${topic} has practical applications in various fields, helping solve problems and understand complex systems.` },
    { question: `What are the key principles underlying ${topic}?`, answer: `The key principles of ${topic} include systematic approaches, logical reasoning, and evidence-based conclusions.` },
    { question: `What methods are used to study ${topic}?`, answer: `${topic} is studied through various methods including analysis, experimentation, and theoretical frameworks.` },
    { question: `How does ${topic} relate to other areas of study?`, answer: `${topic} connects to other disciplines through shared concepts, methodologies, and applications.` }
  ]
  
  return genericQuestions
}

// Function to get comprehensive question pools for subjects
function getSubjectQuestionPools(subject: string, difficulty: string): Array<{ question: string, answer: string }> {
  const subjectLower = subject.toLowerCase()
  
  if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy':
        return [
          { question: `What are variables in ${subject}?`, answer: `In ${subject}, variables are symbols representing unknown values that can change, allowing us to write general mathematical expressions.` },
          { question: `What are equations in ${subject}?`, answer: `In ${subject}, equations are mathematical statements showing equality between expressions, used to find unknown values.` },
          { question: `What are functions in ${subject}?`, answer: `In ${subject}, functions are relationships between inputs and outputs, where each input has exactly one output.` },
          { question: `How do you solve basic problems in ${subject}?`, answer: `Basic ${subject} problems are solved by identifying what's given, what's asked, choosing appropriate methods, and checking solutions.` },
          { question: `What is the importance of ${subject}?`, answer: `${subject} is important because it develops logical thinking, problem-solving skills, and provides tools for science and engineering.` }
        ]
      case 'medium':
        return [
          { question: `How do you work with complex expressions in ${subject}?`, answer: `Working with complex expressions in ${subject} requires understanding order of operations, combining like terms, and applying algebraic properties.` },
          { question: `What are the key problem-solving strategies in ${subject}?`, answer: `Key strategies in ${subject} include breaking problems into steps, using multiple approaches, checking work, and understanding underlying concepts.` },
          { question: `How do you graph functions in ${subject}?`, answer: `Graphing functions in ${subject} involves plotting points, understanding transformations, identifying key features like intercepts and asymptotes.` },
          { question: `What are the applications of ${subject} in other fields?`, answer: `${subject} applies to physics, engineering, economics, computer science, and many other fields requiring quantitative analysis.` },
          { question: `How do you verify solutions in ${subject}?`, answer: `Solutions in ${subject} are verified by substituting back into original equations, checking reasonableness, and using alternative methods.` }
        ]
      case 'hard':
        return [
          { question: `What are advanced techniques in ${subject}?`, answer: `Advanced ${subject} techniques include complex analysis, optimization methods, advanced algebraic structures, and sophisticated problem-solving approaches.` },
          { question: `How do you approach multi-step problems in ${subject}?`, answer: `Multi-step ${subject} problems require systematic planning, breaking into sub-problems, maintaining accuracy, and synthesizing results.` },
          { question: `What are the theoretical foundations of ${subject}?`, answer: `The theoretical foundations of ${subject} include axioms, theorems, proofs, and logical structures that ensure mathematical rigor.` },
          { question: `How do you handle abstract concepts in ${subject}?`, answer: `Abstract concepts in ${subject} are handled through visualization, concrete examples, analogies, and building from familiar ideas.` },
          { question: `What are the connections between different areas of ${subject}?`, answer: `Different areas of ${subject} connect through shared principles, similar techniques, and unified theoretical frameworks.` }
        ]
    }
  } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
    switch (difficulty) {
      case 'easy':
        return [
          { question: `What is the scientific method in ${subject}?`, answer: `The scientific method in ${subject} is a systematic approach involving observation, hypothesis formation, experimentation, and conclusion drawing.` },
          { question: `What are the basic concepts in ${subject}?`, answer: `Basic concepts in ${subject} include fundamental principles, key terminology, and foundational ideas that support advanced learning.` },
          { question: `How do you conduct experiments in ${subject}?`, answer: `Experiments in ${subject} require careful planning, controlled variables, accurate measurements, and proper data recording.` },
          { question: `What tools are used in ${subject}?`, answer: `${subject} uses various tools including measuring instruments, laboratory equipment, computational software, and analytical techniques.` },
          { question: `Why is ${subject} important?`, answer: `${subject} is important for understanding natural phenomena, solving real-world problems, and advancing technology and medicine.` }
        ]
      case 'medium':
        return [
          { question: `How do you analyze data in ${subject}?`, answer: `Data analysis in ${subject} involves statistical methods, pattern recognition, error analysis, and drawing valid conclusions from evidence.` },
          { question: `What are the key theories in ${subject}?`, answer: `Key theories in ${subject} are well-supported explanations that unify observations and predict new phenomena.` },
          { question: `How do you design experiments in ${subject}?`, answer: `Experiment design in ${subject} requires identifying variables, controlling conditions, ensuring reproducibility, and minimizing bias.` },
          { question: `What are the applications of ${subject}?`, answer: `${subject} applications include technology development, medical advances, environmental solutions, and industrial processes.` },
          { question: `How do you interpret results in ${subject}?`, answer: `Result interpretation in ${subject} involves comparing to hypotheses, considering uncertainty, and relating to existing knowledge.` }
        ]
      case 'hard':
        return [
          { question: `What are advanced research methods in ${subject}?`, answer: `Advanced research in ${subject} uses sophisticated techniques, complex modeling, interdisciplinary approaches, and cutting-edge technology.` },
          { question: `How do you handle complex systems in ${subject}?`, answer: `Complex systems in ${subject} require systems thinking, mathematical modeling, computational analysis, and understanding emergent properties.` },
          { question: `What are the current frontiers in ${subject}?`, answer: `Current frontiers in ${subject} include emerging technologies, unsolved problems, interdisciplinary research, and novel theoretical frameworks.` },
          { question: `How do you evaluate scientific evidence in ${subject}?`, answer: `Evaluating evidence in ${subject} requires critical thinking, understanding methodology, assessing reliability, and considering alternative explanations.` },
          { question: `What are the ethical considerations in ${subject}?`, answer: `Ethical considerations in ${subject} include research integrity, environmental impact, safety protocols, and responsible application of knowledge.` }
        ]
    }
  }
  
  // Generic subject handling
  const genericQuestions = [
    { question: `What are the fundamentals of ${subject}?`, answer: `The fundamentals of ${subject} include basic concepts, key terminology, and foundational principles that support advanced learning.` },
    { question: `How do you study ${subject} effectively?`, answer: `Effective ${subject} study involves active learning, regular practice, connecting concepts, and applying knowledge to real situations.` },
    { question: `What skills are developed through ${subject}?`, answer: `${subject} develops critical thinking, analytical skills, problem-solving abilities, and systematic approaches to complex challenges.` },
    { question: `How does ${subject} connect to other disciplines?`, answer: `${subject} connects to other disciplines through shared methodologies, overlapping concepts, and interdisciplinary applications.` },
    { question: `What are the career applications of ${subject}?`, answer: `${subject} has career applications in various fields, providing valuable skills and knowledge for professional development.` },
    { question: `What are the main challenges in learning ${subject}?`, answer: `Main challenges in learning ${subject} include mastering complex concepts, developing problem-solving skills, and applying theoretical knowledge.` }
  ]
  
  return genericQuestions
}

// Helper function to generate topic-specific flashcards with variety (kept for backward compatibility)
function generateTopicFlashcard(topic: string, difficulty: string, cardIndex: number): { question: string, answer: string } {
  const topicLower = topic.toLowerCase()
  
  // Create different types of questions for variety
  const questionTypes = ['definition', 'application', 'example', 'comparison']
  const questionType = questionTypes[cardIndex % questionTypes.length]
  
  if (topicLower.includes('quadratic')) {
    switch (difficulty) {
      case 'easy':
        return questionType === 'definition' 
          ? { question: 'What is a quadratic equation?', answer: 'A quadratic equation is a polynomial equation of degree 2, written in the form ax² + bx + c = 0, where a ≠ 0. The graph of a quadratic function is a parabola.' }
          : { question: 'What is the standard form of a quadratic equation?', answer: 'The standard form is ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0. This form makes it easy to identify the coefficients for solving.' }
      case 'medium':
        return questionType === 'application'
          ? { question: 'How do you find the vertex of a quadratic function y = ax² + bx + c?', answer: 'The vertex is at x = -b/(2a). Substitute this x-value back into the equation to find the y-coordinate. The vertex form is y = a(x - h)² + k where (h,k) is the vertex.' }
          : { question: 'What is the discriminant and what does it tell us?', answer: 'The discriminant is b² - 4ac. If positive, there are 2 real roots; if zero, 1 real root; if negative, no real roots (2 complex roots).' }
      case 'hard':
        return { question: 'Solve x² - 5x + 6 = 0 using factoring and the quadratic formula', answer: 'Factoring: (x - 2)(x - 3) = 0, so x = 2 or x = 3. Quadratic formula: x = (5 ± √(25-24))/2 = (5 ± 1)/2, giving x = 3 or x = 2.' }
    }
  } else if (topicLower.includes('algebra')) {
    switch (difficulty) {
      case 'easy':
        return questionType === 'definition'
          ? { question: 'What is algebra?', answer: 'Algebra is a branch of mathematics that uses symbols (usually letters) to represent unknown numbers or variables in equations and expressions.' }
          : { question: 'What is a variable in algebra?', answer: 'A variable is a symbol (like x, y, or z) that represents an unknown value that can change. Variables allow us to write general mathematical relationships.' }
      case 'medium':
        return questionType === 'application'
          ? { question: 'How do you solve the equation 3x + 7 = 22?', answer: 'Subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5. Check: 3(5) + 7 = 15 + 7 = 22 ✓' }
          : { question: 'What are like terms and how do you combine them?', answer: 'Like terms have the same variables with the same exponents. Combine by adding/subtracting coefficients: 3x + 5x = 8x, but 3x + 5y cannot be simplified.' }
      case 'hard':
        return { question: 'Solve the system: 2x + 3y = 12 and x - y = 1', answer: 'From equation 2: x = y + 1. Substitute into equation 1: 2(y + 1) + 3y = 12 → 2y + 2 + 3y = 12 → 5y = 10 → y = 2. Then x = 3. Solution: (3, 2)' }
    }
  } else if (topicLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy':
        return questionType === 'definition'
          ? { question: 'What is calculus?', answer: 'Calculus is the mathematical study of continuous change. It has two main branches: differential calculus (derivatives/rates of change) and integral calculus (areas/accumulation).' }
          : { question: 'What is a derivative?', answer: 'A derivative represents the instantaneous rate of change of a function at a point. Geometrically, it\'s the slope of the tangent line to the curve at that point.' }
      case 'medium':
        return questionType === 'application'
          ? { question: 'Find the derivative of f(x) = x³ + 2x² - 5x + 1', answer: 'Using the power rule: f\'(x) = 3x² + 4x - 5. The power rule states that d/dx(xⁿ) = nxⁿ⁻¹.' }
          : { question: 'What is the chain rule?', answer: 'If f(g(x)) is a composite function, then its derivative is f\'(g(x)) × g\'(x). Used when you have a function inside another function.' }
      case 'hard':
        return { question: 'Find the derivative of y = ln(sin(x²))', answer: 'Using chain rule: dy/dx = (1/sin(x²)) × cos(x²) × 2x = (2x cos(x²))/sin(x²) = 2x cot(x²)' }
    }
  }
  
  // Generic topic handling
  switch (difficulty) {
    case 'easy':
      return { 
        question: `What are the basic concepts of ${topic}?`, 
        answer: `${topic} involves fundamental principles and definitions that form the foundation for more advanced study. Focus on understanding key terminology and basic applications.` 
      }
    case 'medium':
      return { 
        question: `How do you apply ${topic} to solve problems?`, 
        answer: `Applying ${topic} requires understanding the underlying principles, identifying relevant formulas or methods, and systematically working through problem-solving steps.` 
      }
    case 'hard':
      return { 
        question: `What are advanced techniques in ${topic}?`, 
        answer: `Advanced ${topic} involves complex problem-solving, synthesis of multiple concepts, and application to real-world scenarios requiring critical thinking and analysis.` 
      }
    default:
      return { 
        question: `Explain the key principles of ${topic}`, 
        answer: `${topic} encompasses important concepts that require understanding of definitions, applications, and relationships between different elements.` 
      }
  }
}

// Helper function to generate subject-specific flashcards with variety
function generateSubjectFlashcard(subject: string, difficulty: string, cardIndex: number): { question: string, answer: string } {
  const subjectLower = subject.toLowerCase()
  
  // Create different types of questions for variety
  const questionTypes = ['definition', 'method', 'application', 'strategy']
  const questionType = questionTypes[cardIndex % questionTypes.length]
  
  if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('calculus')) {
    const mathTopics = ['variables', 'equations', 'functions', 'graphs', 'problem-solving']
    const topic = mathTopics[cardIndex % mathTopics.length]
    
    switch (difficulty) {
      case 'easy':
        return {
          question: `What is a ${topic} in ${subject}?`,
          answer: `In ${subject}, ${topic} ${topic === 'variables' ? 'are symbols representing unknown values' : topic === 'equations' ? 'are mathematical statements showing equality between expressions' : topic === 'functions' ? 'are relationships between inputs and outputs' : topic === 'graphs' ? 'are visual representations of mathematical relationships' : 'involves systematic approaches to finding solutions'}.`
        }
      case 'medium':
        return {
          question: `How do you work with ${topic} in ${subject}?`,
          answer: `Working with ${topic} in ${subject} requires understanding the underlying principles, applying appropriate methods, and checking your work for accuracy and reasonableness.`
        }
      case 'hard':
        return {
          question: `What are advanced concepts related to ${topic} in ${subject}?`,
          answer: `Advanced ${topic} in ${subject} involves complex applications, multiple-step procedures, and connections to other mathematical concepts requiring deep understanding.`
        }
    }
  } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
    const scienceTopics = ['scientific method', 'data analysis', 'theories', 'experiments', 'applications']
    const topic = scienceTopics[cardIndex % scienceTopics.length]
    
    switch (difficulty) {
      case 'easy':
        return {
          question: `What is the ${topic} in ${subject}?`,
          answer: `The ${topic} in ${subject} ${topic === 'scientific method' ? 'is a systematic approach to understanding natural phenomena through observation, hypothesis, and experimentation' : topic === 'data analysis' ? 'involves collecting, organizing, and interpreting information to draw conclusions' : topic === 'theories' ? 'are well-supported explanations for natural phenomena based on evidence' : topic === 'experiments' ? 'are controlled procedures designed to test hypotheses' : 'involve using scientific knowledge to solve real-world problems'}.`
        }
      case 'medium':
        return {
          question: `How do you apply ${topic} in ${subject}?`,
          answer: `Applying ${topic} in ${subject} requires careful planning, systematic execution, and critical evaluation of results to ensure valid conclusions.`
        }
      case 'hard':
        return {
          question: `What are complex aspects of ${topic} in ${subject}?`,
          answer: `Complex ${topic} in ${subject} involves advanced techniques, multiple variables, and sophisticated analysis requiring deep scientific understanding.`
        }
    }
  }
  
  // Generic subject handling
  const genericTopics = ['fundamentals', 'methods', 'applications', 'analysis', 'synthesis']
  const topic = genericTopics[cardIndex % genericTopics.length]
  
  switch (difficulty) {
    case 'easy':
      return {
        question: `What are the ${topic} of ${subject}?`,
        answer: `The ${topic} of ${subject} include basic concepts, key terminology, and foundational principles that support more advanced learning.`
      }
    case 'medium':
      return {
        question: `How do you apply ${topic} in ${subject}?`,
        answer: `Applying ${topic} in ${subject} involves understanding core concepts, using appropriate techniques, and connecting ideas to solve problems.`
      }
    case 'hard':
      return {
        question: `What are advanced ${topic} in ${subject}?`,
        answer: `Advanced ${topic} in ${subject} require synthesis of multiple concepts, critical thinking, and sophisticated problem-solving approaches.`
      }
    default:
      return {
        question: `Explain the key aspects of ${subject}`,
        answer: `${subject} involves understanding core principles, applying knowledge systematically, and developing skills for analysis and problem-solving.`
      }
  }
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
      case 'easy': return 'ax² + bx + c = 0, where a ≠ 0. This is the standard form of a quadratic equation where a, b, and c are constants and a cannot be zero.'
      case 'medium': return 'The vertex is at (-b/2a, f(-b/2a)). You can find it by completing the square or using the vertex formula. The vertex represents the maximum or minimum point of the parabola.'
      case 'hard': return 'Using the quadratic formula: x = (5 ± √(25-24))/2 = (5 ± √1)/2 = (5 ± 1)/2. Therefore x = 6/2 = 3 or x = 4/2 = 2. The solutions are x = 3 and x = 2.'
    }
  } else if (topicLower.includes('algebra')) {
    switch (difficulty) {
      case 'easy': return 'A variable is a symbol (usually a letter like x, y, or z) that represents an unknown number or value that can change. Variables allow us to write general mathematical expressions and equations.'
      case 'medium': return 'To solve linear equations, isolate the variable by performing the same operations on both sides of the equation. Use inverse operations: addition/subtraction, then multiplication/division.'
      case 'hard': return 'Using FOIL method: (3x + 2)(2x - 1) = 3x(2x) + 3x(-1) + 2(2x) + 2(-1) = 6x² - 3x + 4x - 2 = 6x² + x - 2'
    }
  } else if (topicLower.includes('calculus')) {
    switch (difficulty) {
      case 'easy': return 'A derivative represents the instantaneous rate of change or slope of a function at any given point. It tells us how fast a function is changing at that specific point.'
      case 'medium': return 'Using the power rule: d/dx(x²) = 2x¹ = 2x. The derivative of x² with respect to x is 2x.'
      case 'hard': return 'The chain rule states: if f(g(x)), then the derivative is f\'(g(x)) × g\'(x). This is used when you have a function inside another function (composite functions).'
    }
  } else if (topicLower.includes('physics')) {
    switch (difficulty) {
      case 'easy': return `${topic} involves the study of matter, energy, and their interactions. It uses mathematical principles to describe natural phenomena and predict behavior of physical systems.`
      case 'medium': return `${topic} requires understanding fundamental laws and principles, applying mathematical formulas, and analyzing relationships between different physical quantities like force, motion, energy, and time.`
      case 'hard': return `Advanced ${topic} involves complex problem-solving using calculus, vector analysis, and sophisticated mathematical models to describe phenomena like electromagnetic fields, quantum mechanics, or thermodynamics.`
    }
  } else if (topicLower.includes('chemistry')) {
    switch (difficulty) {
      case 'easy': return `${topic} is the study of matter, its properties, composition, and the changes it undergoes during chemical reactions. It involves atoms, molecules, and their interactions.`
      case 'medium': return `${topic} requires understanding atomic structure, chemical bonding, reaction mechanisms, and stoichiometry. Key concepts include balancing equations, calculating molar masses, and predicting reaction products.`
      case 'hard': return `Advanced ${topic} involves complex reaction mechanisms, thermodynamics, kinetics, and quantum chemistry. It requires mastering concepts like orbital theory, reaction rates, and equilibrium constants.`
    }
  } else if (topicLower.includes('biology')) {
    switch (difficulty) {
      case 'easy': return `${topic} is the study of living organisms, their structure, function, growth, and evolution. It covers everything from cells and genetics to ecosystems and biodiversity.`
      case 'medium': return `${topic} involves understanding cellular processes, genetics, evolution, anatomy, and physiology. Key concepts include DNA replication, protein synthesis, metabolism, and ecological relationships.`
      case 'hard': return `Advanced ${topic} requires deep understanding of molecular biology, biochemistry, genetics, and complex biological systems. It involves analyzing pathways, genetic engineering, and evolutionary mechanisms.`
    }
  } else if (topicLower.includes('history')) {
    switch (difficulty) {
      case 'easy': return `${topic} involves studying past events, people, and civilizations to understand how they shaped our modern world. It includes analyzing causes, effects, and patterns in human development.`
      case 'medium': return `${topic} requires analyzing primary sources, understanding chronology, and examining the social, political, and economic factors that influenced historical events and their consequences.`
      case 'hard': return `Advanced ${topic} involves critical analysis of historical interpretations, comparing multiple perspectives, and understanding complex relationships between different historical factors and their long-term impacts.`
    }
  } else if (topicLower.includes('literature') || topicLower.includes('english')) {
    switch (difficulty) {
      case 'easy': return `${topic} involves reading, analyzing, and interpreting written works including novels, poems, plays, and essays. It focuses on understanding themes, characters, and literary devices.`
      case 'medium': return `${topic} requires analyzing literary techniques, understanding historical context, and interpreting symbolism, metaphors, and themes. It involves critical thinking about author's purpose and message.`
      case 'hard': return `Advanced ${topic} involves complex literary analysis, comparing different works and periods, understanding literary theory, and developing sophisticated interpretations of texts and their cultural significance.`
    }
  }
  
  // Enhanced generic answers for other topics
  switch (difficulty) {
    case 'easy': return `${topic} is a fundamental concept that involves understanding basic principles, definitions, and core ideas. Start by learning the key terminology and basic applications in real-world contexts.`
    case 'medium': return `${topic} requires understanding the main principles, methodologies, and relationships between different concepts. Focus on how these ideas connect and apply to solve problems or analyze situations.`
    case 'hard': return `Advanced ${topic} involves complex analysis, synthesis of multiple concepts, and application to challenging scenarios. It requires deep understanding of underlying principles and ability to think critically and creatively.`
    default: return `${topic} encompasses a range of concepts and principles that build upon each other. Study the fundamentals first, then progress to more complex applications and analysis.`
  }
}

// Types are now imported directly from './types' where needed