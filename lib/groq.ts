import axios from 'axios'
import { StudyPlan, StudyPlanRequest, StudySession, Flashcard } from './types'

export async function generateStudyPlan(
  request: StudyPlanRequest,
  existingScheduleContext?: any
): Promise<StudyPlan> {
  try {
    console.log('Making request to Groq API...')
    console.log('API Key exists:', !!process.env.GROQ_API_KEY)

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your .env.local file.')
    }

    const prompt = buildStudyPlanPrompt(request, existingScheduleContext)

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
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
    
    const content = response.data.choices[0].message.content.trim()
    
    // Extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const studyPlanData = JSON.parse(jsonMatch[0])
    
    // Ensure the response has the correct structure
    const studyPlan: StudyPlan = {
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
  "totalHours": number,
  "sessions": [
    {
      "id": "session_1",
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "subject": "Subject Name",
      "topic": "Specific Topic",
      "duration": number_in_hours,
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
  ]
}

**Instructions:**
1. Create a realistic study schedule from today until the target date
2. Distribute ${request.dailyHours} hours per day across the subjects
3. Include variety: lectures, practice, review, and assessments
4. Generate 10-15 relevant flashcards covering key concepts
5. Ensure progression from basic to advanced topics
6. Include specific materials and resources
7. Add helpful study notes and tips for each session

${contextInfo}

Respond with ONLY the JSON object, no additional text or formatting.`
}

// Export types for compatibility
export { StudyPlan, StudyPlanRequest, StudySession, Flashcard } from './types'