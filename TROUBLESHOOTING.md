# StudyPal AI Chatbot Troubleshooting Guide

## 🔍 Common Issues and Solutions

### 1. Chatbot Not Responding / Connection Failed

**Symptoms:**
- Chatbot shows "Sorry, I'm having trouble connecting right now"
- No response from PalBot
- Error messages in browser console

**Solutions:**

#### A. Check API Key
1. Open `.env.local` file
2. Verify `GROQ_API_KEY` is set and complete
3. Groq API keys should:
   - Start with `gsk_`
   - Be 60+ characters long
   - Have no extra spaces or line breaks

**Fix:** Get a new API key from [Groq Console](https://console.groq.com/keys)

#### B. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

#### C. Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or use Ctrl+Shift+R

### 2. API Key Issues

**Error:** "API key is invalid or missing"

**Solutions:**
1. **Get New API Key:**
   - Go to https://console.groq.com/keys
   - Create new API key
   - Copy the COMPLETE key (all characters)

2. **Update .env.local:**
   ```
   GROQ_API_KEY=your_complete_api_key_here
   ```

3. **Restart Server:**
   ```bash
   npm run dev
   ```

### 3. Rate Limit Errors

**Error:** "Too many requests" or "Rate limit exceeded"

**Solutions:**
- Wait 5-10 minutes before trying again
- Reduce frequency of messages
- Check if multiple instances are running

### 4. Network/Connection Issues

**Error:** "Network connectivity issue" or "ENOTFOUND"

**Solutions:**
1. Check internet connection
2. Try accessing https://api.groq.com in browser
3. Check firewall/antivirus settings
4. Try different network (mobile hotspot)

### 5. Development Server Issues

**Error:** "Cannot POST /api/chat" or 404 errors

**Solutions:**
1. **Ensure server is running:**
   ```bash
   npm run dev
   ```

2. **Check you're on correct port:**
   - Should be http://localhost:3000
   - Not http://localhost:3001 or other ports

3. **Restart server completely:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

## 🧪 Testing Tools

### Quick API Test
Run this in the studypal-ai directory:
```bash
node tmp_rovodev_groq_test.js
```

### Manual API Test
1. Open browser developer tools (F12)
2. Go to Network tab
3. Send a message in chatbot
4. Look for `/api/chat` request
5. Check response for error details

## 🔧 Emergency Fixes

### If Nothing Works:
1. **Use the backup chatbot:**
   ```bash
   # Copy backup over main chatbot
   cp components/ChatbotBackup.tsx components/Chatbot.tsx
   ```

2. **Reset environment:**
   ```bash
   # Delete .env.local and recreate
   rm .env.local
   cp .env.local.example .env.local
   # Add your API key to .env.local
   ```

3. **Fresh install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

## 📋 Checklist for Working Chatbot

- [ ] `.env.local` exists with valid `GROQ_API_KEY`
- [ ] API key starts with `gsk_` and is 60+ characters
- [ ] Development server running on http://localhost:3000
- [ ] No console errors in browser
- [ ] Internet connection working
- [ ] Can access https://api.groq.com

## 🆘 Still Not Working?

1. Check browser console (F12) for specific error messages
2. Look at terminal where `npm run dev` is running for server errors
3. Try the diagnostic script: `node tmp_rovodev_groq_test.js`
4. Test with a fresh API key from Groq

## 📞 Debug Information to Collect

When reporting issues, include:
- Error messages from browser console
- Error messages from terminal/server
- Your API key length (not the actual key)
- Browser and version
- Operating system
- Node.js version (`node --version`)