# StudyPal AI - Your Intelligent Study Companion

A comprehensive AI-powered study platform that transforms how students learn. Generate personalized study plans, track progress, quiz yourself, and chat with your AI study buddy - all in one place. Built with Next.js 15, TypeScript, Tailwind CSS, and powered by Groq AI.

## ✨ Features

### Core Study Tools
- 🧠 **AI Study Plan Generator**: Create personalized study schedules tailored to your subjects, available time, and learning style
- 📅 **Smart Weekly Scheduling**: Optimized day-by-day study plans with balanced workloads
- 🎯 **Exam Revision Timelines**: Strategic revision schedules leading up to your exam dates
- 💡 **Personalized Learning Tips**: AI-generated study strategies based on your specific needs
- 🃏 **Interactive Flashcards**: Auto-generated flashcards with quiz mode for active learning
- 📊 **Dashboard & Progress Tracking**: Monitor your study plans and track your learning journey

### Advanced Features
- 🤖 **PalBot AI Assistant**: Your 24/7 study companion chatbot for questions and motivation
- 🎮 **Flashcard Quiz Mode**: Test yourself with interactive quizzes (study/test modes)
- 📈 **Performance Analytics**: Track quiz scores and identify areas for improvement
- 💾 **Plan Management**: Save, edit, and manage multiple study plans
- 📱 **Fully Responsive**: Seamless experience across desktop, tablet, and mobile
- 🎨 **Beautiful UI/UX**: Modern, animated interface with smooth transitions
- 📥 **Export Options**: Download study plans and flashcards for offline use

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **AI Engine**: Groq API (Llama 3.3 70B & Mixtral models)
- **State Management**: React Hooks + Local Storage
- **Animations**: Tailwind CSS animations + CSS transitions
- **HTTP Client**: Axios
- **Markdown**: React-Markdown
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Groq API key (get one free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd studypal-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Fill out the study form**:
   - Add your subjects
   - Set daily study hours
   - Choose your target exam date
   - Specify weak areas (optional)
   - Set preferred study times (optional)

2. **Generate your plan**:
   - Click "Generate Study Plan"
   - Wait for AI to create your personalized plan

3. **Use your study plan**:
   - Follow the weekly schedule
   - Use the revision timeline
   - Study with the generated flashcards
   - Apply the learning tips and exam strategies

4. **Export and save**:
   - Download your plan as a text file
   - Create new plans as needed

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables in the Vercel dashboard
   - Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

```
GROQ_API_KEY=your_groq_api_key_here
```

## 📁 Project Structure

```
studypal-ai/
├── app/
│   ├── api/
│   │   ├── generate-plan/route.ts    # Study plan generation endpoint
│   │   └── chat/route.ts             # Chatbot endpoint
│   ├── about/page.tsx                # About page
│   ├── dashboard/page.tsx            # User dashboard
│   ├── examples/page.tsx             # Example study plans
│   ├── study-assistant/page.tsx      # Main study assistant interface
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout with navbar
│   └── page.tsx                      # Landing page
├── components/
│   ├── ui/                          # Shadcn/ui components
│   ├── Chatbot.tsx                  # AI chatbot component
│   ├── ChatbotWrapper.tsx           # Chatbot container
│   ├── ConflictDialog.tsx           # Schedule conflict handler
│   ├── FlashcardQuiz.tsx            # Interactive quiz component
│   ├── Footer.tsx                   # Site footer
│   ├── Navbar.tsx                   # Navigation bar
│   ├── PageTransition.tsx           # Page animations
│   ├── StudyPlanDisplay.tsx         # Study plan viewer
│   └── StudyPlanForm.tsx            # Study plan creation form
├── lib/
│   ├── chatbot.ts                   # Chatbot logic
│   ├── groq.ts                      # Groq AI integration
│   ├── scheduleManager.ts           # Schedule management
│   ├── types.ts                     # TypeScript types
│   └── utils.ts                     # Utility functions
└── public/                          # Static assets
```

## 🔌 API Reference

### POST /api/generate-plan

Generates a personalized AI study plan.

**Request Body:**
```typescript
{
  subjects: string[]
  dailyHours: number
  targetDate: string
  studyLevel: string
  studyStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  weakAreas?: string[]
  preferredTimes?: string[]
}
```

**Response:**
```typescript
{
  weeklySchedule: { [day: string]: DaySchedule }
  revisionSchedule: RevisionItem[]
  learningTips: string[]
  flashcards: Flashcard[]
  examStrategy: string[]
  focusAreas?: string[]
}
```

### POST /api/chat

Chat with the AI study assistant.

**Request Body:**
```typescript
{
  message: string
  context?: ChatContext
  conversationHistory?: ChatMessage[]
}
```

**Response:**
```typescript
{
  response: string
}
```

## 🎨 Customization

### Adding New Features

1. **Study Methods**: Modify prompts in `lib/groq.ts` to add learning techniques
2. **AI Models**: Switch between Llama and Mixtral models in `lib/groq.ts`
3. **Quiz Types**: Extend `FlashcardQuiz.tsx` for new quiz formats
4. **Chatbot Personality**: Customize PalBot's responses in `lib/chatbot.ts`
5. **Dashboard Widgets**: Add analytics components to `dashboard/page.tsx`

### Styling & Theming

```css
/* Custom color palette in globals.css */
--studypal-blue: #3b82f6
--studypal-cyan: #06b6d4
--studypal-amber: #f59e0b
--studypal-gray: #1f2937
```

- Modify `tailwind.config.js` for theme customization
- Edit component styles for UI changes
- Adjust animations in `globals.css`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain existing code style
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏆 Credits

Built with ❤️ by the StudyPal team using:
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Groq AI](https://groq.com/) - AI infrastructure

## 🆘 Support

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|  
| API Key Error | Verify `GROQ_API_KEY` in `.env.local` |
| Build Fails | Run `npm install` to update dependencies |
| Chatbot Not Working | Check API key has chat model access |
| Plans Not Saving | Enable localStorage in browser |
| Slow Generation | Normal for complex plans (10-15s) |

### Get Help
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/studypal-ai/issues)
- 💬 Join our [Discord community](https://discord.gg/studypal)

## 📊 Performance

- **Page Load**: < 2s (optimized)
- **AI Response Time**: 5-15s (depending on complexity)
- **Lighthouse Score**: 95+ (Performance)
- **Mobile Responsive**: 100% optimized
- **Browser Support**: Chrome, Firefox, Safari, Edge

---

<div align="center">
  <img src="https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome">
</div>

<div align="center">
  <p><strong>StudyPal AI - Transform Your Learning Journey</strong></p>
  <p>Made with ❤️ and ☕ by students, for students</p>
</div>
