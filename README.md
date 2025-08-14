# StudyPal AI - AI-Powered Study Companion

A modern SaaS web application that generates personalized study plans, revision schedules, and learning tips using AI. Built with Next.js, Tailwind CSS, and powered by Groq LLM.

## Features

- 🧠 **AI-Powered Study Plans**: Generate personalized study schedules based on your subjects, available time, and weak areas
- 📅 **Smart Scheduling**: Balanced weekly schedules that optimize your study time
- 🎯 **Revision Planning**: Automated revision schedules leading up to your exams
- 💡 **Learning Tips**: Personalized study advice and strategies
- 🃏 **Flashcards**: AI-generated flashcards for key concepts
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 💾 **Export Options**: Download your study plan as a text file

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + ShadCN UI components
- **AI Engine**: Groq API (Mixtral-8x7B model)
- **Language**: TypeScript
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

## Project Structure

```
studypal-ai/
├── app/
│   ├── api/generate-plan/route.ts    # API endpoint for study plan generation
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main page
├── components/
│   ├── ui/                          # Reusable UI components
│   ├── StudyPlanForm.tsx            # Form for collecting user input
│   └── StudyPlanDisplay.tsx         # Display generated study plans
├── lib/
│   ├── groq.ts                      # Groq API integration
│   └── utils.ts                     # Utility functions
└── ...config files
```

## API Reference

### POST /api/generate-plan

Generates a personalized study plan based on user input.

**Request Body:**
```typescript
{
  subjects: string[]
  dailyHours: number
  targetDate: string
  weakAreas: string[]
  studyLevel: string
  preferredTimes: string[]
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
}
```

## Customization

### Adding New Features

1. **Custom Study Methods**: Modify the prompt in `lib/groq.ts` to include specific study techniques
2. **Additional Subjects**: The app supports any subjects - just add them in the form
3. **Different AI Models**: Change the model in `lib/groq.ts` to use different Groq models
4. **Enhanced UI**: Add more components in the `components/ui/` directory

### Styling

The app uses Tailwind CSS with a custom design system. Modify:
- `app/globals.css` for global styles
- `tailwind.config.js` for theme customization
- Individual components for specific styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues:

1. Check that your Groq API key is correctly set
2. Ensure you have a stable internet connection
3. Verify that all dependencies are installed
4. Check the browser console for any errors

For additional help, please open an issue on GitHub.

## Roadmap

- [ ] User authentication and saved plans
- [ ] Integration with calendar apps
- [ ] Mobile app version
- [ ] Advanced analytics and progress tracking
- [ ] Collaborative study plans
- [ ] Integration with more AI providers

---

Built with ❤️ using Next.js, Tailwind CSS, and Groq AI