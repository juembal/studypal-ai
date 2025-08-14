import axios from 'axios'

export interface StudyPlanRequest {
  subjects: string[]
  dailyHours: number
  targetDate: string
  weakAreas: string[]
  studyLevel: string
  preferredTimes: string[] | string
  specificTopics?: string[]
  includeWeekends?: string
}

export interface StudyPlan {
  weeklySchedule: WeeklySchedule
  revisionSchedule: RevisionItem[]
  learningTips: string[]
  flashcards: Flashcard[]
  examStrategy: string[]
  onlineResources: OnlineResource[]
}

export interface OnlineResource {
  title: string
  url: string
  type: 'video' | 'course' | 'article' | 'practice' | 'documentation'
  subject: string
  topic: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  isFree: boolean
}

export interface WeeklySchedule {
  [key: string]: DaySchedule
}

export interface DaySchedule {
  subjects: SubjectSession[]
  totalHours: number
}

export interface SubjectSession {
  subject: string
  duration: number
  timeSlot: string
  focus: string
  priority: 'high' | 'medium' | 'low'
}

export interface RevisionItem {
  subject: string
  date: string
  topics: string[]
  duration: number
}

export interface Flashcard {
  subject: string
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// Utility function for exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error
      const isRateLimit = error.response?.status === 429 || 
                         error.message?.includes('Rate limit') ||
                         error.response?.data?.error?.message?.includes('Rate limit')
      
      if (!isRateLimit || attempt === maxRetries) {
        throw error
      }
      
      // Extract wait time from error message if available
      let waitTime = baseDelay * Math.pow(2, attempt)
      const rateLimitMatch = error.response?.data?.error?.message?.match(/try again in (\d+\.?\d*)s/)
      if (rateLimitMatch) {
        waitTime = Math.max(parseFloat(rateLimitMatch[1]) * 1000, waitTime)
      }
      
      console.log(`Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError
}

export async function generateStudyPlan(request: StudyPlanRequest & { forceNewSchedule?: boolean, randomSeed?: number, regenerateAttempt?: boolean, retryAttempt?: number }, existingScheduleContext?: string): Promise<StudyPlan> {
  
  // Add randomization and regeneration context
  const isRegeneration = request.forceNewSchedule || request.regenerateAttempt || request.retryAttempt
  const randomizationNote = isRegeneration ? `
🔄 REGENERATION MODE ACTIVE - SEED: ${request.randomSeed || Date.now()}
⚡ CRITICAL: This is a regeneration attempt. You MUST create a completely different schedule than any previous attempt.
🎲 RANDOMIZATION REQUIRED: Use the seed ${request.randomSeed || Date.now()} to ensure schedule variety.
🚫 AVOID REPETITION: Do not repeat the same time patterns, days, or session structures.
` : ''

  const prompt = `
You are an expert study planner. Create a comprehensive, personalized study plan based on the following student information:

${randomizationNote}

Subjects: ${request.subjects.join(', ')}
Daily Study Hours Available: ${request.dailyHours}
Target Exam Date: ${request.targetDate}
Specific Topics to Focus On: ${request.specificTopics?.join(', ') || 'Not specified'}
Weak Areas: ${request.weakAreas.join(', ') || 'Not specified'}
Study Level: ${request.studyLevel}
Preferred Study Times: ${Array.isArray(request.preferredTimes) ? request.preferredTimes.join(', ') : request.preferredTimes || 'Not specified'}
Weekend Preference: ${request.includeWeekends || 'weekdays'}

${existingScheduleContext ? `\n${existingScheduleContext}\n` : ''}

WEEKEND SCHEDULING INSTRUCTIONS:
${request.includeWeekends === 'weekdays' ? 
  'IMPORTANT: Only schedule study sessions Monday through Friday. Leave Saturday and Sunday completely empty with no subjects and 0 total hours.' :
  request.includeWeekends === 'all' ?
  'IMPORTANT: Distribute study sessions across all 7 days including weekends (Saturday and Sunday). Use weekends to balance the workload.' :
  'IMPORTANT: Use weekends (Saturday and Sunday) only if needed to meet the daily hour requirements. Prefer weekdays but include weekends if necessary for proper distribution.'
}

Please provide a detailed study plan in JSON format with the following structure:
{
  "weeklySchedule": {
    "Monday": {
      "subjects": [
        {
          "subject": "Subject Name",
          "duration": 2,
          "timeSlot": "9:00 AM - 11:00 AM",
          "focus": "Chapter/Topic focus",
          "priority": "high"
        }
      ],
      "totalHours": 4
    }
    // ... for each day of the week
  },
  "revisionSchedule": [
    {
      "subject": "Subject Name",
      "date": "2024-01-15",
      "topics": ["Topic 1", "Topic 2"],
      "duration": 2
    }
  ],
  "learningTips": [
    "Specific tip 1",
    "Specific tip 2"
  ],
  "flashcards": [
    {
      "subject": "Subject Name",
      "question": "Question text",
      "answer": "Answer text",
      "difficulty": "medium"
    }
  ],
  "examStrategy": [
    "Strategy point 1",
    "Strategy point 2"
  ],
  "onlineResources": [
    {
      "title": "Khan Academy: Quadratic Equations",
      "url": "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations",
      "type": "video",
      "subject": "Mathematics",
      "topic": "Quadratic Equations",
      "description": "Interactive lessons on solving quadratic equations with step-by-step explanations",
      "difficulty": "beginner",
      "estimatedTime": "45 minutes",
      "isFree": true
    },
    {
      "title": "YouTube: Quadratic Equations Tutorial",
      "url": "https://www.youtube.com/results?search_query=quadratic+equations+tutorial+beginner",
      "type": "video",
      "subject": "Mathematics",
      "topic": "Quadratic Equations",
      "description": "Search results for quadratic equations tutorials on YouTube",
      "difficulty": "beginner",
      "estimatedTime": "varies",
      "isFree": true
    }
  ]
}

Make sure to:
1. Focus heavily on the specific topics mentioned - these should be the primary content of study sessions
2. Prioritize weak areas with more study time and targeted strategies
3. Balance subjects throughout the week while emphasizing the specified topics
4. Include regular revision sessions for the specific topics
5. Provide practical, actionable tips related to the topics and weak areas
6. Create relevant flashcards specifically for the mentioned topics
7. Consider the student's preferred study times
8. Ensure the daily hours don't exceed the available time
9. If specific topics are provided, make them the core focus of the study plan
10. Structure study sessions around mastering these specific topics rather than general subject review
${isRegeneration ? `
🔄 REGENERATION SPECIFIC REQUIREMENTS:
11. CREATE ENTIRELY NEW TIME SLOTS - avoid any patterns from previous attempts
12. USE DIFFERENT DAYS - if previous attempt used Monday-Friday, try Tuesday-Saturday or include weekends
13. VARY SESSION LENGTHS - mix 1-hour, 1.5-hour, and 2-hour sessions instead of uniform lengths
14. ALTERNATE TIME PERIODS - if previous was morning-heavy, make this evening-heavy
15. RANDOMIZE SUBJECT ORDER - don't follow alphabetical or traditional subject ordering
16. EXPERIMENT WITH UNCONVENTIONAL TIMES - early morning (6-8 AM) or late evening (8-10 PM)
17. BREAK PATTERNS - if previous attempt clustered subjects, spread them out more
18. USE SEED ${request.randomSeed || Date.now()} FOR VARIATION - let this number influence your time slot choices
` : ''}
11. Include 8-12 high-quality online learning resources that directly relate to the specific topics mentioned
12. Provide a mix of resource types: videos (Khan Academy, YouTube), courses (Coursera, edX), articles, practice sites
13. Prioritize free resources but include some premium options if they're exceptional
14. Match resource difficulty to the student's study level
15. Include estimated time commitments for each resource
16. Focus resources on the exact topics and weak areas specified by the student
17. IMPORTANT: Use only REAL, WORKING URLs from these trusted platforms:
    - Khan Academy: https://www.khanacademy.org/
    - YouTube: https://www.youtube.com/ (use search URLs like https://www.youtube.com/results?search_query=quadratic+equations+tutorial)
    - Coursera: https://www.coursera.org/
    - edX: https://www.edx.org/
    - MIT OpenCourseWare: https://ocw.mit.edu/
    - Crash Course: https://www.youtube.com/user/crashcourse
    - Professor Leonard: https://www.youtube.com/channel/UCoHhuummRZaIVX7bD4t2czg
    - 3Blue1Brown: https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw
    - PatrickJMT: https://www.youtube.com/user/patrickJMT
    - Organic Chemistry Tutor: https://www.youtube.com/channel/UCEWpbFLzoYGPfuWUMFPSaoA
18. For YouTube videos, use search URLs with relevant keywords instead of specific video URLs
19. For Khan Academy, use topic-specific URLs like https://www.khanacademy.org/math/algebra
20. For courses, use the main course search pages rather than specific course URLs that might not exist

Return only valid JSON without any additional text or formatting.
`

  try {
    console.log('Making request to Google Gemini API...')
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY)
    
    // Wrap the API call in retry logic
    const response = await retryWithBackoff(async () => {
      return await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational consultant and study planner. Always respond with valid JSON only.'
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
          }
        }
      )
    }, 3, 2000) // 3 retries, starting with 2 second delay

    console.log('Groq API response received')
    const content = response.data.choices[0].message.content
    console.log('Content length:', content.length)
    console.log('Raw content:', content.substring(0, 500) + '...')
    
    // Try to clean up the content if it has extra text
    let cleanContent = content.trim()
    
    // Find JSON start and end
    const jsonStart = cleanContent.indexOf('{')
    const jsonEnd = cleanContent.lastIndexOf('}')
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1)
    }
    
    console.log('Cleaned content preview:', cleanContent.substring(0, 200) + '...')
    
    const parsedData = JSON.parse(cleanContent)
    console.log('Parsed data structure:', Object.keys(parsedData))
    
    return parsedData
  } catch (error) {
    console.error('Detailed error:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your Gemini API key.')
    }
    if (error.response?.status === 403) {
      throw new Error('API access forbidden. Please check your Gemini API key permissions.')
    }
    throw new Error(`Failed to generate study plan: ${error.response?.data?.error?.message || error.message}`)
  }
}