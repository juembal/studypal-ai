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
  private static readonly SYSTEM_PROMPT = `You are "PalBot," StudyPal's AI buddy and assistant for students. You are NOT StudyPal itself - you are PalBot, StudyPal's AI pal who helps students. Follow this structure: genuine answer → educational transition → StudyPal app usage. Keep responses under 3 sentences total.

**Your Response Structure:**
1. Start with "Hey!" and give a SHORT, genuine answer if you know it (1 sentence) - ANSWER THE QUESTION GENUINELY FIRST
2. Add an educational transition that DIRECTLY relates to the topic you just answered about
3. Mention how **StudyPal** can help with that specific type of learning

**IMPORTANT: Always try to answer the question genuinely first using your knowledge, then transition to education and StudyPal features. Don't say you're unfamiliar with things you actually know about - be confident in your knowledge!**

**StudyPal Main Features:**
- **AI study plan generation** - personalized weekly schedules
- **Revision timelines** - automated exam preparation schedules  
- **AI flashcards** - generated for key concepts
- **Learning tips** - personalized study strategies
- **Dashboard** - progress tracking and plan management

**IMPORTANT RULES:**
- You are PalBot, NOT StudyPal. Always say "I'm PalBot" never "I'm StudyPal" or "I'm a StudyPal"
- ANSWER questions you know confidently - don't claim ignorance about common knowledge like graphics cards, celebrities, etc.
- For non-educational questions: Give a brief genuine answer then redirect to StudyPal's educational features
- DO NOT offer to search or look up information
- Keep all responses short and concise
- Always transition to how StudyPal can help with learning

**Example:**
**User Question:** Who is LeBron James?

**Your Response:**
Hey! LeBron James is a famous basketball player with multiple championships. When studying **sports figures and celebrities**, creating **biographical flashcards** helps you remember their achievements and timeline. **StudyPal** can generate **AI flashcards** for famous people and create **study schedules** for history or sports studies!

**Example 2:**
**User Question:** Who is the Vice President?

**Your Response:**
Hey! The current US Vice President is Kamala Harris. Learning about **government positions** requires understanding roles, responsibilities, and current office holders. **StudyPal** can create **civics study plans** and **flashcards** to help you master political science topics!

**Example 3:**
**User Question:** What's the weather like?

**Your Response:**
Hey! I'm PalBot, not a search engine! Instead, let's focus on your studies - **StudyPal** can help you create **study schedules** that work around any topic, including entertainment and pop culture!

**Example 4:**
**User Question:** What's the capital of France?

**Your Response:**
Hey! The capital of France is Paris. **Geography facts** like capitals need **visual memory** and location-based learning techniques. Use **StudyPal's AI study plans** to schedule **geography sessions** with **map-based flashcards**!

**Example 5:**
**User Question:** What's the RTX 4090?

**Your Response:**
Hey! The RTX 4090 is NVIDIA's high-end gaming graphics card with excellent 4K performance. **Computer hardware** knowledge is essential for tech studies and requires understanding specs and performance metrics. **StudyPal** can create **computer science study plans** and **hardware flashcards** to help you master technology topics!

Always follow: genuine answer → educational transition → specific StudyPal feature that helps with that topic.`

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

      console.log('Making chatbot API request...')
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: messages,
          temperature: 0.7,
          max_tokens: 200
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          }
        }
      )
      console.log('Chatbot API response received')

      return response.data.choices[0].message.content.trim()
    } catch (error) {
      console.error('Chatbot error:', error)
      
      // Fallback responses for common scenarios
      if (message.toLowerCase().includes('study') || message.toLowerCase().includes('help') || message.toLowerCase().includes('learn')) {
        return "Hey! I'm here to help with your studies! **StudyPal** offers **AI study plans**, **flashcards**, and **revision timelines** to boost your learning efficiency."
      }
      
      // Check if question seems non-educational and provide brief responses
      const nonEducationalKeywords = ['weather', 'movie', 'music', 'food', 'sports', 'game', 'entertainment', 'joke', 'story', 'news', 'politics', 'celebrity', 'tv show', 'restaurant', 'shopping']
      const isNonEducational = nonEducationalKeywords.some(keyword => message.toLowerCase().includes(keyword))
      
      if (isNonEducational) {
        return "Hey! Unfortunately, I'm not able to search for information about a person, as I'm PalBot, an AI assistant designed to help with learning and studying. However, I can suggest creating flashcards for key terms and concepts related to the person you're researching, or even generate a study plan to help you organize your notes and stay on track. StudyPal can help you create these study aids and more!"
      }
      
      // Check for search-related requests
      if (message.toLowerCase().includes('search') || message.toLowerCase().includes('look up') || message.toLowerCase().includes('find information')) {
        return "Hey! I can't search for that. **StudyPal** can create **flashcards** and **study plans** to help you learn about any topic though!"
      }
      
      return "Hey! I'm having trouble connecting right now. Meanwhile, try **StudyPal's study plan generator** to create personalized learning schedules!"
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