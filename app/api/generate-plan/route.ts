import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan } from '@/lib/groq'
import { StudyPlanRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - generate-plan')
    const body: StudyPlanRequest = await request.json()
    console.log('Request body received:', body)
    
    // Validate required fields
    if (!body.subjects || body.subjects.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject is required' },
        { status: 400 }
      )
    }
    
    if (!body.dailyHours || body.dailyHours <= 0) {
      return NextResponse.json(
        { error: 'Daily hours must be greater than 0' },
        { status: 400 }
      )
    }
    
    if (!body.targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      )
    }

    // Generate study plan using Groq AI
    const studyPlan = await generateStudyPlan(body, (body as any).existingScheduleContext)
    
    return NextResponse.json(studyPlan)
  } catch (error: any) {
    console.error('Error in generate-plan API:', error)
    
    // Check if it's a rate limit error
    const isRateLimit = error.message?.includes('Rate limit') || 
                       error.response?.status === 429
    
    if (isRateLimit) {
      // Extract wait time from error message if available
      const rateLimitMatch = error.message?.match(/try again in (\d+\.?\d*)s/)
      const waitTime = rateLimitMatch ? parseFloat(rateLimitMatch[1]) : 10
      
      return NextResponse.json(
        { 
          error: `Rate limit reached. Please wait ${Math.ceil(waitTime)} seconds and try again.`,
          retryAfter: Math.ceil(waitTime),
          isRateLimit: true
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan. Please try again.' },
      { status: 500 }
    )
  }
}