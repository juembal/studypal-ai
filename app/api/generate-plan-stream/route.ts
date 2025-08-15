import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan } from '@/lib/groq'
import { StudyPlanRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    console.log('SSE API route called - generate-plan-stream')
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

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        // Progress callback function
        const onProgress = (message: string) => {
          const data = `data: ${JSON.stringify({ type: 'progress', message })}\n\n`
          controller.enqueue(encoder.encode(data))
        }
        
        try {
          // Send initial message
          onProgress('🚀 Starting study plan generation...')
          
          // Generate study plan with progress updates
          const studyPlan = await generateStudyPlan(
            body, 
            (body as any).existingScheduleContext,
            onProgress
          )
          
          // Send success message
          onProgress('✅ Study plan generated successfully!')
          
          // Send the final result
          const successData = `data: ${JSON.stringify({ 
            type: 'success', 
            data: studyPlan 
          })}\n\n`
          controller.enqueue(encoder.encode(successData))
          
        } catch (error: any) {
          console.error('Error in SSE generate-plan:', error)
          
          // Send error message
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message || 'Failed to generate study plan' 
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
        } finally {
          // Close the stream
          controller.close()
        }
      }
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error: any) {
    console.error('Error in generate-plan-stream API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan. Please try again.' },
      { status: 500 }
    )
  }
}