import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan } from '@/lib/groq'
import { StudyPlanRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - generate-plan')
    const body: StudyPlanRequest = await request.json()
    console.log('Request body received:', body)
    console.log('Environment check - GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY)
    
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

    // Generate study plan using Groq AI (with built-in fallback)
    console.log('About to call generateStudyPlan...')
    const studyPlan = await generateStudyPlan(body, (body as any).existingScheduleContext)
    console.log('Study plan generated successfully:', studyPlan)
    
    // Check if this was generated using fallback (we can add a flag to identify this)
    if (studyPlan.id?.includes('fallback') || studyPlan.name?.includes('Fallback')) {
      console.log('Fallback plan was used due to API issues')
      // Still return success, but maybe add a note
      return NextResponse.json({
        ...studyPlan,
        generatedBy: 'fallback',
        note: 'Generated using our smart fallback system due to high AI demand'
      })
    }
    
    return NextResponse.json(studyPlan)
  } catch (error: any) {
    console.error('Error in generate-plan API:', error)
    
    // The generateStudyPlan function should now handle all errors internally and return a fallback
    // If we get here, it means something went very wrong, so we should still try to provide a basic response
    console.log('Unexpected error, attempting emergency fallback...')
    
    try {
      // Import the fallback function directly
      const { generateStudyPlan } = await import('@/lib/groq')
      const emergencyPlan = await generateStudyPlan(body, (body as any).existingScheduleContext)
      
      return NextResponse.json({
        ...emergencyPlan,
        generatedBy: 'emergency-fallback',
        note: 'Generated using emergency fallback due to system issues'
      })
    } catch (fallbackError) {
      console.error('Even emergency fallback failed:', fallbackError)
      
      // Last resort: return a very basic plan structure
      return NextResponse.json(
        { 
          error: 'Unable to generate study plan at this time. Please try again later.',
          details: error.message || 'Unknown error occurred'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan. Please try again.' },
      { status: 500 }
    )
  }
}