# StudyPal AI - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Your Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key

### Step 3: Configure Environment
```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and add your API key
GROQ_API_KEY=your_actual_api_key_here
```

### Step 4: Run the Application
```bash
npm run dev
```

### Step 5: Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## ✅ Verification

1. You should see the StudyPal AI homepage
2. Fill out the study plan form
3. Click "Generate Study Plan"
4. You should receive an AI-generated study plan

## 🔧 Troubleshooting

### Common Issues:

**"Failed to generate study plan"**
- Check that your Groq API key is correct in `.env.local`
- Ensure you have internet connection
- Verify the API key has sufficient credits

**Build errors**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

**TypeScript errors**
- The app should work even with TypeScript warnings
- Run `npm run build` to check for critical errors

## 🚀 Deployment

### Deploy to Vercel (Free):
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add your `GROQ_API_KEY` in Vercel's environment variables
4. Deploy!

## 📝 Next Steps

- Customize the AI prompts in `lib/groq.ts`
- Add more UI components
- Integrate with calendar apps
- Add user authentication

## 🆘 Need Help?

Check the main README.md for detailed documentation or open an issue on GitHub.