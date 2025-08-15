'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { StudyPlanRequest } from '@/lib/types'
import { Plus, X, Loader2, Calendar, Clock, Brain, BookOpen } from 'lucide-react'

interface StudyPlanFormProps {
  onSubmit: (data: StudyPlanRequest) => void
  isLoading: boolean
}

export default function StudyPlanForm({ onSubmit, isLoading }: StudyPlanFormProps) {
  const [subjectsInput, setSubjectsInput] = useState<string>('')
  const [specificTopics, setSpecificTopics] = useState<string>('')
  const [preferredTimes, setPreferredTimes] = useState<string>('')
  const [studyTimePreference, setStudyTimePreference] = useState<string>('')
  const [dailyHours, setDailyHours] = useState<number[]>([4])
  const [targetDate, setTargetDate] = useState<string>('')
  const [studyLevel, setStudyLevel] = useState<'high-school' | 'undergraduate' | 'graduate' | 'professional'>('undergraduate')
  const [includeWeekends, setIncludeWeekends] = useState<string>('weekdays')

  // Generate quick date options
  const getQuickDateOptions = () => {
    const today = new Date()
    const options = []
    
    // 1 week from now
    const oneWeek = new Date(today)
    oneWeek.setDate(today.getDate() + 7)
    options.push({ label: '1 Week', value: oneWeek.toISOString().split('T')[0] })
    
    // 2 weeks from now
    const twoWeeks = new Date(today)
    twoWeeks.setDate(today.getDate() + 14)
    options.push({ label: '2 Weeks', value: twoWeeks.toISOString().split('T')[0] })
    
    // 1 month from now
    const oneMonth = new Date(today)
    oneMonth.setMonth(today.getMonth() + 1)
    options.push({ label: '1 Month', value: oneMonth.toISOString().split('T')[0] })
    
    // 3 months from now
    const threeMonths = new Date(today)
    threeMonths.setMonth(today.getMonth() + 3)
    options.push({ label: '3 Months', value: threeMonths.toISOString().split('T')[0] })
    
    return options
  }

  const quickDateOptions = getQuickDateOptions()

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, ''])
  }

  const removeField = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.map((item, i) => i === index ? value : item))
  }

  // Auto-correct and format text
  const autoCorrectText = (text: string): string => {
    if (!text) return text
    
    // Common subject corrections
    const subjectCorrections: { [key: string]: string } = {
      'math': 'Mathematics',
      'maths': 'Mathematics',
      'mathematic': 'Mathematics',
      'mathematics': 'Mathematics',
      'bio': 'Biology',
      'biology': 'Biology',
      'chem': 'Chemistry',
      'chemistry': 'Chemistry',
      'phys': 'Physics',
      'physics': 'Physics',
      'hist': 'History',
      'history': 'History',
      'eng': 'English',
      'english': 'English',
      'lit': 'Literature',
      'literature': 'Literature',
      'sci': 'Science',
      'science': 'Science',
      'comp sci': 'Computer Science',
      'computer science': 'Computer Science',
      'cs': 'Computer Science',
      'programming': 'Programming',
      'coding': 'Programming',
      'econ': 'Economics',
      'economics': 'Economics',
      'psych': 'Psychology',
      'psychology': 'Psychology',
      'geo': 'Geography',
      'geography': 'Geography',
      'art': 'Art',
      'music': 'Music',
      'pe': 'Physical Education',
      'physical education': 'Physical Education',
      'spanish': 'Spanish',
      'french': 'French',
      'german': 'German',
      'chinese': 'Chinese',
      'japanese': 'Japanese'
    }
    
    // Clean and normalize the text
    let corrected = text.toLowerCase().trim()
    
    // Check for exact matches in corrections
    if (subjectCorrections[corrected]) {
      return subjectCorrections[corrected]
    }
    
    // Handle partial matches and common typos
    for (const [typo, correction] of Object.entries(subjectCorrections)) {
      if (corrected.includes(typo) || typo.includes(corrected)) {
        return correction
      }
    }
    
    // If no specific correction found, just capitalize properly
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Parse and auto-correct subjects from comma-separated input
    const subjects = subjectsInput
      .split(',')
      .map(s => autoCorrectText(s.trim()))
      .filter(s => s !== '')
    
    console.log('Form Debug:')
    console.log('Raw subjectsInput:', subjectsInput)
    console.log('Auto-corrected subjects:', subjects)
    
    const filteredPreferredTimes = preferredTimes ? preferredTimes.split(',').map(s => s.trim()).filter(s => s !== '') : []
    const filteredSpecificTopics = specificTopics ? specificTopics.split(',').map(s => autoCorrectText(s.trim())).filter(s => s !== '') : []
    
    if (subjects.length === 0) {
      // This validation is now handled by the disabled button state
      return
    }
    
    if (!targetDate) {
      // This validation is now handled by the disabled button state
      return
    }

    const formData: StudyPlanRequest = {
      subjects: subjects,
      dailyHours: dailyHours[0],
      targetDate,
      studyLevel,
      preferredTimes: studyTimePreference ? 
        (preferredTimes.trim() ? `${studyTimePreference}: ${preferredTimes}` : studyTimePreference) 
        : preferredTimes,
      specificTopics: filteredSpecificTopics,
      includeWeekends: includeWeekends
    }

    onSubmit(formData)
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in px-4">
      <Card className="glass-effect border-0 shadow-glow hover:shadow-glow-lg transition-all duration-500 hover-lift">
        <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-3 font-heading">
            Step 1: Your Goals
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Let's get started with your study preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Subjects */}
            <div className="space-y-3">
              <Label htmlFor="subjects" className="text-base font-semibold font-heading">Subjects</Label>
              <div className="space-y-2">
                <Input
                  id="subjects"
                  value={subjectsInput}
                  onChange={(e) => setSubjectsInput(e.target.value)}
                  placeholder="Enter subjects separated by commas (e.g., Math, Biology, History)"
                  className="text-sm sm:text-base h-10 sm:h-12 px-3 sm:px-4 border-2 focus:border-studypal-blue/50 transition-colors"
                  required
                />
                <p className="text-sm text-gray-500">
                  💡 Tip: Separate multiple subjects with commas
                </p>
                {subjectsInput && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjectsInput.split(',').map((subject, index) => {
                      const trimmed = subject.trim()
                      const corrected = autoCorrectText(trimmed)
                      const wasChanged = trimmed.toLowerCase() !== corrected.toLowerCase()
                      return trimmed ? (
                        <span key={index} className={`px-3 py-1.5 bg-gradient-to-r ${wasChanged ? 'from-studypal-green/10 to-studypal-green/15 text-studypal-green border-studypal-green/20' : 'from-studypal-blue/10 to-studypal-cyan/10 text-studypal-blue border-studypal-blue/20'} border rounded-full text-sm font-medium`}>
                          {corrected}
                          {wasChanged && <span className="ml-1 text-xs opacity-75">✓</span>}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                {subjectsInput && subjectsInput.split(',').some(s => {
                  const trimmed = s.trim()
                  return trimmed && autoCorrectText(trimmed).toLowerCase() !== trimmed.toLowerCase()
                }) && (
                  <p className="text-xs text-studypal-green mt-1">
                    ✓ Auto-corrected spelling and formatting
                  </p>
                )}
              </div>
            </div>

            {/* Daily Hours Slider */}
            <div className="space-y-4">
              <Label className="text-base font-semibold font-heading flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Study Hours: {dailyHours[0]} hour{dailyHours[0] !== 1 ? 's' : ''}
              </Label>
              <div className="px-2">
                <Slider
                  value={dailyHours}
                  onValueChange={setDailyHours}
                  max={12}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span>12 hours</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-studypal-blue/5 to-studypal-cyan/5 rounded-lg p-3 border border-studypal-blue/10">
                <p className="text-sm text-studypal-gray-600 font-medium">
                  {dailyHours[0] <= 2 && "💡 Light study schedule - perfect for busy days"}
                  {dailyHours[0] >= 3 && dailyHours[0] <= 5 && "✅ Balanced study schedule - recommended for most students"}
                  {dailyHours[0] >= 6 && dailyHours[0] <= 8 && "🔥 Intensive study schedule - great for exam preparation"}
                  {dailyHours[0] >= 9 && "⚡ Very intensive schedule - make sure to take breaks!"}
                </p>
              </div>
            </div>

            {/* Preferred Study Times */}
            <div className="space-y-3">
              <Label className="text-base font-semibold font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-studypal-blue" />
                Preferred Study Times (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'early-bird', label: '🌅 Early Bird', desc: '5-9 AM' },
                  { value: 'morning', label: '☀️ Morning Person', desc: '9 AM-12 PM' },
                  { value: 'afternoon', label: '🌤️ Afternoon Focus', desc: '12-5 PM' },
                  { value: 'evening', label: '🌆 Evening Study', desc: '5-9 PM' },
                  { value: 'night-owl', label: '🦉 Night Owl', desc: '9 PM-12 AM' },
                  { value: 'flexible', label: '🔄 Flexible', desc: 'Any time' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStudyTimePreference(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      studyTimePreference === option.value
                        ? 'bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 text-white border-0 shadow-md'
                        : 'hover:bg-studypal-blue/5 hover:border-studypal-blue/30 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className={`text-xs ${studyTimePreference === option.value ? 'text-white/80' : 'text-gray-500'}`}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
              {studyTimePreference && (
                <div className="bg-gradient-to-r from-studypal-blue/5 to-studypal-cyan/5 rounded-lg p-3 border border-studypal-blue/10">
                  <p className="text-sm text-studypal-gray-600 font-medium">
                    {studyTimePreference === 'early-bird' && "🌅 Great choice! Early morning hours are perfect for focused learning"}
                    {studyTimePreference === 'morning' && "☀️ Excellent! Morning sessions help build consistent study habits"}
                    {studyTimePreference === 'afternoon' && "🌤️ Perfect! Afternoon study can be very productive after lunch"}
                    {studyTimePreference === 'evening' && "🌆 Nice! Evening study works well for reviewing the day's learning"}
                    {studyTimePreference === 'night-owl' && "🦉 Good for you! Just remember to get enough sleep for retention"}
                    {studyTimePreference === 'flexible' && "🔄 Smart approach! Flexibility helps adapt to your changing schedule"}
                  </p>
                </div>
              )}
              <Textarea
                id="preferredTimes"
                value={preferredTimes}
                onChange={(e) => setPreferredTimes(e.target.value)}
                placeholder="Add specific time slots if needed (e.g., Monday 9-11 AM, Wednesday 7-9 PM)"
                className="min-h-[60px] px-4 py-3 border-2 focus:border-studypal-blue/50 transition-colors text-base"
              />
            </div>

            {/* Target Date with Quick Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold font-heading flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Target Exam Date
              </Label>
              
              {/* Quick Date Options */}
              <div className="grid grid-cols-2 gap-3">
                {quickDateOptions.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant={targetDate === option.value ? "default" : "outline"}
                    onClick={() => setTargetDate(option.value)}
                    className={`text-sm font-mono-ui transition-all duration-300 ${
                      targetDate === option.value 
                        ? 'bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 text-white border-0 shadow-md' 
                        : 'hover:bg-studypal-blue/5 hover:border-studypal-blue/30'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              
              {/* Custom Date Input */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 font-heading">Or choose a custom date:</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 px-4 border-2 focus:border-studypal-blue/50 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Study Level */}
            <div className="space-y-3">
              <Label htmlFor="studyLevel" className="text-base font-semibold font-heading">Study Level</Label>
              <select
                id="studyLevel"
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value as 'high-school' | 'undergraduate' | 'graduate' | 'professional')}
                className="flex h-12 w-full rounded-md border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studypal-blue/50 focus-visible:ring-offset-2 transition-colors"
                required
              >
                <option value="high-school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="professional">Professional Certification</option>
              </select>
            </div>

            {/* Weekend Preference */}
            <div className="space-y-3">
              <Label htmlFor="includeWeekends" className="text-base font-semibold font-heading flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Study Schedule
              </Label>
              <select
                id="includeWeekends"
                value={includeWeekends}
                onChange={(e) => setIncludeWeekends(e.target.value)}
                className="flex h-12 w-full rounded-md border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studypal-blue/50 focus-visible:ring-offset-2 transition-colors"
                required
              >
                <option value="weekdays">Weekdays Only (Monday - Friday)</option>
                <option value="all">Include Weekends (Monday - Sunday)</option>
                <option value="flexible">Flexible (AI decides based on workload)</option>
              </select>
              <div className="bg-gradient-to-r from-studypal-blue/5 to-studypal-cyan/5 rounded-lg p-3 border border-studypal-blue/10">
                <p className="text-sm text-studypal-gray-600 font-medium">
                  {includeWeekends === 'weekdays' && "📅 Study sessions will be scheduled Monday through Friday only"}
                  {includeWeekends === 'all' && "🗓️ Study sessions will be distributed across all 7 days including weekends"}
                  {includeWeekends === 'flexible' && "🤖 AI will include weekends only if needed to meet your daily hour requirements"}
                </p>
              </div>
            </div>

            {/* Specific Topics to Study */}
            <div className="space-y-3">
              <Label htmlFor="specificTopics" className="text-base font-semibold font-heading">Specific Topics to Study</Label>
              <Textarea
                id="specificTopics"
                value={specificTopics}
                onChange={(e) => setSpecificTopics(e.target.value)}
                placeholder="Enter specific topics you want to focus on, separated by commas (e.g., Quadratic Equations, Cell Division, World War II, Photosynthesis)"
                className="min-h-[100px] px-4 py-3 border-2 focus:border-studypal-blue/50 transition-colors text-base"
                required
              />
              <p className="text-sm text-gray-500">
                🎯 Tip: Be specific! Instead of "Math", try "Quadratic Equations, Trigonometry, Derivatives"
              </p>
              {specificTopics && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {specificTopics.split(',').map((topic, index) => {
                    const trimmed = topic.trim()
                    const corrected = autoCorrectText(trimmed)
                    const wasChanged = trimmed.toLowerCase() !== corrected.toLowerCase()
                    return trimmed ? (
                      <span key={index} className={`px-3 py-1.5 bg-gradient-to-r ${wasChanged ? 'from-studypal-amber/10 to-studypal-amber/15 text-studypal-amber border-studypal-amber/20' : 'from-studypal-green/10 to-studypal-green/15 text-studypal-green border-studypal-green/20'} border rounded-full text-sm font-medium`}>
                        {corrected}
                        {wasChanged && <span className="ml-1 text-xs opacity-75">✓</span>}
                      </span>
                    ) : null
                  })}
                </div>
              )}
              {specificTopics && specificTopics.split(',').some(s => {
                const trimmed = s.trim()
                return trimmed && autoCorrectText(trimmed).toLowerCase() !== trimmed.toLowerCase()
              }) && (
                <p className="text-xs text-studypal-green mt-1">
                  ✓ Auto-corrected spelling and formatting
                </p>
              )}
            </div>



            {/* Generate Button */}
            <div className="pt-6">
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg btn-enhanced font-mono-ui" 
                size="lg" 
                disabled={isLoading || !subjectsInput.trim() || !targetDate || !specificTopics.trim()}
              >
                {isLoading ? (
                  <>
                    <BookOpen className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                    <span className="text-sm sm:text-lg">Generating Your Study Plan...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-lg font-semibold">Generate My Study Plan</span>
                    {subjectsInput.trim() && targetDate && (
                      <span className="ml-2 text-sm opacity-90">
                        ({subjectsInput.split(',').filter(s => s.trim()).length} subject{subjectsInput.split(',').filter(s => s.trim()).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </>
                )}
              </Button>
              {(!subjectsInput.trim() || !targetDate || !specificTopics.trim()) && (
                <div className="text-center mt-4 p-3 bg-studypal-amber/10 border border-studypal-amber/20 rounded-lg">
                  <p className="text-sm text-studypal-gray-700 font-medium">
                    {!subjectsInput.trim() && !targetDate && !specificTopics.trim() && "📝 Please add subjects, select a target date, and specify topics to continue"}
                    {!subjectsInput.trim() && targetDate && specificTopics.trim() && "📚 Please add at least one subject to study"}
                    {subjectsInput.trim() && !targetDate && specificTopics.trim() && "📅 Please select your target exam date"}
                    {subjectsInput.trim() && targetDate && !specificTopics.trim() && "🎯 Please specify the topics you want to study"}
                    {!subjectsInput.trim() && !targetDate && specificTopics.trim() && "📝 Please add subjects and select a target date to continue"}
                    {!subjectsInput.trim() && targetDate && !specificTopics.trim() && "📚 Please add subjects and specify topics to study"}
                    {subjectsInput.trim() && !targetDate && !specificTopics.trim() && "📅 Please select a target date and specify topics to study"}
                  </p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}