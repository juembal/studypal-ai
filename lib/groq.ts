import axios from 'axios'
import { StudyPlan, StudyPlanRequest, StudySession, Flashcard } from './types'

export async function generateStudyPlan(
  request: StudyPlanRequest,
  existingScheduleContext?: any
): Promise<StudyPlan> {
  try {
    console.log('Making request to Groq API...')
    console.log('API Key exists:', !!process.env.GROQ_API_KEY)
    console.log('API Key preview:', process.env.GROQ_API_KEY?.substring(0, 10) + '...')

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your .env.local file.')
    }

    const prompt = buildStudyPlanPrompt(request, existingScheduleContext)

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
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
        }
      }
    )

    console.log('Groq API response received')
    console.log('Response status:', response.status)
    console.log('Response data:', response.data)
    
    const content = response.data.choices[0].message.content.trim()
    console.log('Raw content from API:', content)
    
    // Extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/)
    console.log('JSON match found:', !!jsonMatch)
    if (!jsonMatch) {
      console.error('No valid JSON found in response. Content was:', content)
      throw new Error('No valid JSON found in response')
    }

    console.log('Extracted JSON:', jsonMatch[0])
    const studyPlanData = JSON.parse(jsonMatch[0])
    console.log('Parsed study plan data:', studyPlanData)
    
    // Ensure the response has the correct structure
    const studyPlan: any = {
      id: `plan_${Date.now()}`,
      name: studyPlanData.name || `${request.subjects.join(', ')} Study Plan`,
      subjects: request.subjects,
      studyLevel: request.studyLevel,
      totalHours: studyPlanData.totalHours || request.dailyHours * 30,
      dailyHours: request.dailyHours,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: request.targetDate,
      goals: request.goals,
      sessions: studyPlanData.sessions || [],
      flashcards: studyPlanData.flashcards || [],
      // Include any additional data from the AI response
      weeklySchedule: studyPlanData.weeklySchedule,
      revisionSchedule: studyPlanData.revisionSchedule || [],
      learningTips: studyPlanData.learningTips || [],
      examStrategy: studyPlanData.examStrategy || [],
      onlineResources: studyPlanData.onlineResources || [],
      progress: {
        completedSessions: 0,
        totalSessions: studyPlanData.sessions?.length || 0,
        completedHours: 0,
        totalHours: studyPlanData.totalHours || request.dailyHours * 30
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Final study plan structure:', studyPlan)
    return studyPlan

  } catch (error: any) {
    console.error('Groq API error:', error)
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key.')
    }
    if (error.response?.status === 403) {
      throw new Error('API access forbidden. Please check your Groq API key permissions.')
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.')
    }
    
    throw new Error(`Failed to generate study plan: ${error.response?.data?.error?.message || error.message}`)
  }
}

function buildStudyPlanPrompt(request: StudyPlanRequest, existingScheduleContext?: any): string {
  const contextInfo = existingScheduleContext ? 
    `\n\nExisting Schedule Context:\n${JSON.stringify(existingScheduleContext, null, 2)}` : ''

  return `Generate a comprehensive study plan with the following requirements:

**Study Plan Requirements:**
- Subjects: ${request.subjects.join(', ')}
- Study Level: ${request.studyLevel}
- Daily Hours: ${request.dailyHours}
- Target Date: ${request.targetDate}
- Goals: ${request.goals || 'General mastery'}
- Learning Style: ${request.learningStyle || 'mixed'}
- Difficulty Level: ${request.difficulty || 'intermediate'}
- Current Knowledge: ${request.currentKnowledge || 'beginner'}
- Preferences: ${request.preferences || 'none specified'}

**Required JSON Structure:**
{
  "name": "Study Plan Name",
  "totalHours": ${request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5)},
  "sessions": [
    {
      "id": "session_1",
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "timeSlot": "9:00 AM - 11:00 AM",
      "subject": "Subject Name",
      "topic": "Specific Topic",
      "duration": 2,
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
1. Create a realistic study schedule from today until the target date
2. Distribute EXACTLY ${request.dailyHours} hours per day across the subjects
3. ${request.includeWeekends === 'weekdays' ? 'Schedule ONLY Monday through Friday (5 days per week)' : request.includeWeekends === 'all' ? 'Include all 7 days of the week' : 'Use 5-6 days per week as needed'}
4. Each individual session should be 1-3 hours maximum
5. Total daily hours should NOT exceed ${request.dailyHours} hours
6. Generate specific time slots (e.g., "9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM") for each session
7. ${request.preferredTimes ? `Prefer these times: ${request.preferredTimes}` : 'Use common study hours like 9 AM-12 PM, 2 PM-5 PM, 7 PM-9 PM'}
8. Include variety: lectures, practice, review, and assessments
9. Generate 10-15 relevant flashcards covering key concepts
10. Provide 5-8 practical learning tips for effective studying
11. Include 4-6 exam strategy recommendations
12. Add 3-5 online resources (Khan Academy, Coursera, YouTube channels, etc.) for each subject
14. Ensure progression from basic to advanced topics
15. Include specific materials and resources
16. Add helpful study notes and tips for each session

MANDATORY: Your response MUST include ALL sections: sessions, flashcards, learningTips, examStrategy, and onlineResources.

SPECIFIC REQUIREMENTS:
- learningTips: Provide practical, actionable study advice (5-8 tips)
- examStrategy: Include test-taking strategies and preparation methods (4-6 strategies)
- onlineResources: Use ONLY these verified URLs based on subjects:
  * Mathematics: https://www.khanacademy.org/math, https://www.coursera.org/browse/math-and-logic
  * Science/Physics: https://www.khanacademy.org/science/physics, https://ocw.mit.edu/courses/physics/
  * Chemistry: https://www.khanacademy.org/science/chemistry, https://ocw.mit.edu/courses/chemistry/
  * Biology: https://www.khanacademy.org/science/biology, https://www.coursera.org/browse/life-sciences
  * History: https://www.khanacademy.org/humanities/world-history, https://www.coursera.org/browse/arts-and-humanities/history
  * English/Literature: https://www.khanacademy.org/humanities/grammar, https://www.coursera.org/browse/language-learning
  * Computer Science: https://www.khanacademy.org/computing, https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/
  * General Study Skills: https://www.coursera.org/learn/learning-how-to-learn, https://ocw.mit.edu
- flashcards: Cover key concepts from the specified topics (10-15 cards)

IMPORTANT: Keep total weekly hours reasonable - aim for ${request.dailyHours * (request.includeWeekends === 'all' ? 7 : 5)} hours per week maximum.

${contextInfo}

Respond with ONLY the JSON object, no additional text or formatting.`
}

// Types are now imported directly from './types' where needed