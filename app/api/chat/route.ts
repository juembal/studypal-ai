import { NextRequest, NextResponse } from 'next/server'
import { StudyPalChatbot, ChatMessage, ChatContext } from '@/lib/chatbot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, conversationHistory } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Rate limiting check (simple implementation)
    const userIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `chat_${userIP}`
    
    // In a real app, you'd use Redis or similar for rate limiting
    // For now, we'll rely on Groq's built-in rate limiting

    const response = await StudyPalChatbot.sendMessage(
      message,
      context as ChatContext,
      conversationHistory as ChatMessage[]
    )

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message. Please try again.' },
      { status: 500 }
    )
  }
}