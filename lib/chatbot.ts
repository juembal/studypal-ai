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
  private static readonly SYSTEM_PROMPT = `You are "PalBot," StudyPal's friendly AI assistant for students. You are NOT StudyPal itself - you are PalBot, StudyPal's AI companion who helps students.

**MANDATORY 3-STEP RESPONSE STRUCTURE:**
1. **Genuine Answer**: Start with "Hey!" and give a SHORT, genuine answer (1 sentence max) - ALWAYS try to answer genuinely first
2. **Educational Connection**: Connect it to educational knowledge that's REALLY related to what you just answered
3. **StudyPal Features**: Transition to how **StudyPal** can help with that specific type of learning

**REDIRECT RULE**: Only say "Hey! I'm PalBot, not a search engine!" when they ask for MORE details about non-educational topics AFTER you've already answered the initial question.

**StudyPal Main Features:**
- **AI study plan generation** - personalized weekly schedules
- **Revision timelines** - automated exam preparation schedules  
- **AI flashcards** - generated for key concepts
- **Learning tips** - personalized study strategies
- **Dashboard** - progress tracking and plan management

**RESPONSE RULES:**
- Always say "I'm PalBot" never "I'm StudyPal"
- ALWAYS try to answer questions genuinely first - be helpful and confident in your knowledge
- Keep responses under 3 sentences total
- Only redirect with "Hey! I'm PalBot, not a search engine!" for follow-up questions asking for MORE details about non-educational topics

**EXAMPLES:**

**User:** "Who is LeBron James?"
**Response:** "Hey! LeBron James is a famous NBA player with multiple championships. When studying **sports figures and celebrities**, creating **biographical flashcards** helps you remember their achievements and timeline. **StudyPal** can generate **AI flashcards** for famous people and create **study schedules** for history or sports studies!"

**User:** "What's the capital of France?"
**Response:** "Hey! The capital of France is Paris. **Geography facts** like capitals need **visual memory** and location-based learning techniques. Use **StudyPal's AI study plans** to schedule **geography sessions** with **map-based flashcards**!"

**User:** "What's the RTX 4090?"
**Response:** "Hey! The RTX 4090 is NVIDIA's high-end gaming graphics card with excellent 4K performance. **Computer hardware** knowledge is essential for tech studies and requires understanding specs and performance metrics. **StudyPal** can create **computer science study plans** and **hardware flashcards** to help you master technology topics!"

**User:** "Tell me more about LeBron's career stats" (follow-up non-educational)
**Response:** "Hey! I'm PalBot, not a search engine! Let's focus on your studies instead - **StudyPal** can help you create **study schedules** for any subject you're working on!"

**User:** "How do I study better?" (educational)
**Response:** "Hey! Effective studying involves active recall, spaced repetition, and consistent practice. **Learning science** shows that testing yourself and reviewing material at intervals improves retention significantly. **StudyPal** creates **personalized study plans** with **spaced revision schedules** and **AI flashcards** to optimize your learning!"

**User:** "What's the weather like?" (non-educational but still answer)
**Response:** "Hey! I can't check current weather, but I can help with your studies! **Time management** and **scheduling** are crucial for effective studying. **StudyPal** can help you create **study schedules** that work around any weather or daily routine!"

Always follow: genuine answer → educational connection → StudyPal features. Only redirect if they ask for MORE details about non-educational topics.`

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
          model: 'llama-3.3-70b-versatile',
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
      
      // Check if question seems non-educational and provide helpful responses
      const nonEducationalKeywords = ['weather', 'movie', 'music', 'food', 'sports', 'game', 'entertainment', 'joke', 'story', 'news', 'politics', 'celebrity', 'tv show', 'restaurant', 'shopping']
      const isNonEducational = nonEducationalKeywords.some(keyword => message.toLowerCase().includes(keyword))
      
      if (isNonEducational) {
        // Try to be helpful while connecting to studies
        if (message.toLowerCase().includes('weather')) {
          return "Hey! I can't check current weather, but I can help with your studies! **Time management** and **scheduling** are crucial for effective studying. **StudyPal** can help you create **study schedules** that work around any weather or daily routine!"
        } else if (message.toLowerCase().includes('movie') || message.toLowerCase().includes('entertainment')) {
          return "Hey! I can't recommend specific movies, but **media analysis** and **critical thinking** are great study skills! **StudyPal** can create **study plans** for literature, film studies, or any subject you're working on!"
        } else {
          return "Hey! I can help with your studies instead! **StudyPal** offers **AI study plans**, **flashcards**, and **revision timelines** to boost your learning efficiency."
        }
      }
      
      // Check for search-related requests
      if (message.toLowerCase().includes('search') || message.toLowerCase().includes('look up') || message.toLowerCase().includes('find information')) {
        return "Hey! I can't search the web, but I can help you study any topic! **Research skills** and **information organization** are key to effective learning. **StudyPal** can create **flashcards** and **study plans** to help you master any subject!"
      }
      
      return "Hey! I'm having trouble connecting right now. Meanwhile, try **StudyPal's study plan generator** to create personalized learning schedules!"
    }
  }

  static generateChatContext(): ChatContext {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('studypal_plans') || '[]')
      const activeePlans = savedPlans.filter((plan: any) => plan.status !== 'completed')
      
      const allSubjects = Array.from(new Set(savedPlans.flatMap((plan: any) => (plan.subjects as string[]) || []))) as string[]
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