import axios from 'axios'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatContext {
  userSubjects: string[]
  studyLevel: string
  currentPlans: string[]
}

export class StudyPalChatbot {
  private static readonly SYSTEM_PROMPT = `You are "PalBot," an AI assistant designed to help students. Your core function is to provide a short, direct answer to a user's question, then immediately follow up with a related, educational transition. Your tone is helpful and encouraging, and you should always use clear formatting to make information easy to digest.

**Response Structure:**
1. **Short, direct answer:** Provide a genuine and concise answer to the user's question. Do not elaborate.
2. **Educational transition:** Immediately follow the answer with a related fact, a question, or a suggestion to help the user learn more about the topic. This should be a seamless transition that encourages them to continue their learning journey.

**Examples:**

**User:** What is the capital of Japan?
**Your Response:** Tokyo. Did you know that the Greater Tokyo Area is the most populous metropolitan area in the world? We can talk about how population density affects city planning if you'd like!

**User:** How do I find the area of a circle?
**Your Response:** Use the formula A = πr², where r is the radius. This formula is derived from calculus. We can explore the relationship between a circle's circumference and its area if you're interested.

**User:** What are some good study habits?
**Your Response:** Creating a consistent schedule, taking regular breaks, and actively recalling information are effective habits. Want me to help you create a personalized study plan for your next exam?

Keep responses concise and educational. Always transition from the direct answer to learning opportunities. Use clear formatting and maintain a helpful, encouraging tone.`

  static async sendMessage(
    message: string, 
    context?: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Build context-aware system prompt
      let systemPrompt = this.SYSTEM_PROMPT
      
      if (context) {
        systemPrompt += `\n\nUser Context:
- Study Level: ${context.studyLevel}
- Subjects: ${context.userSubjects.join(', ')}
- Active Plans: ${context.currentPlans.join(', ')}`
      }

      // Prepare conversation history (limit to last 6 messages for token efficiency)
      const recentHistory = conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message }
      ]

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nConversation History:\n${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}\n\nAssistant:`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 150,
            responseMimeType: "text/plain"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.candidates[0].content.parts[0].text.trim()
    } catch (error) {
      console.error('Chatbot error:', error)
      
      // Fallback responses for common scenarios
      if (message.toLowerCase().includes('study') || message.toLowerCase().includes('help') || message.toLowerCase().includes('learn')) {
        return "I'm here to help with your studies! Try asking about study techniques, time management, specific subjects, or how to create an effective study plan."
      }
      
      // Check if question seems non-educational
      const nonEducationalKeywords = ['weather', 'movie', 'music', 'food', 'sports', 'game', 'entertainment', 'joke', 'story', 'news', 'politics']
      const isNonEducational = nonEducationalKeywords.some(keyword => message.toLowerCase().includes(keyword))
      
      if (isNonEducational) {
        return "I'm focused on helping with your studies and educational goals. Let me know how I can assist with your learning, study planning, or academic questions instead!"
      }
      
      return "I'm having trouble connecting right now. Please try again in a moment, or create a study plan for detailed educational guidance!"
    }
  }

  static generateChatContext(): ChatContext {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const activeePlans = savedPlans.filter((plan: any) => plan.status !== 'completed')
      
      const allSubjects = [...new Set(savedPlans.flatMap((plan: any) => plan.subjects || []))]
      const studyLevels = savedPlans.map((plan: any) => plan.studyLevel).filter(Boolean)
      const mostCommonLevel = studyLevels.length > 0 ? studyLevels[0] : 'undergraduate'
      
      return {
        userSubjects: allSubjects.slice(0, 5), // Limit for token efficiency
        studyLevel: mostCommonLevel,
        currentPlans: activeePlans.map((plan: any) => plan.name).slice(0, 3)
      }
    } catch (error) {
      return {
        userSubjects: [],
        studyLevel: 'undergraduate',
        currentPlans: []
      }
    }
  }

  static getQuickSuggestions(context?: ChatContext): string[] {
    const base = [
      "How can I create an effective study schedule?",
      "What are the best study techniques for retention?",
      "How do I stay motivated during long study sessions?",
      "Tips for improving focus while studying?",
      "How to prepare for exams effectively?",
      "What's the best way to take study notes?"
    ]

    if (context?.userSubjects.length) {
      base.unshift(`Study strategies for ${context.userSubjects[0]}`)
      if (context.userSubjects.length > 1) {
        base.unshift(`How to master ${context.userSubjects[1]}?`)
      }
    }

    return base.slice(0, 4)
  }
}