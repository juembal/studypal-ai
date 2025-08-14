'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Flashcard } from '@/lib/types'
import { RotateCcw, CheckCircle, XCircle, Eye, EyeOff, Trophy, RefreshCw, PenTool, BookOpen } from 'lucide-react'

interface FlashcardQuizProps {
  flashcards: Flashcard[]
  onClose: () => void
}

interface QuizResult {
  correct: number
  incorrect: number
  total: number
  percentage: number
}

export default function FlashcardQuiz({ flashcards, onClose }: FlashcardQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswers, setUserAnswers] = useState<('correct' | 'incorrect' | null)[]>([])
  const [userAttempts, setUserAttempts] = useState<string[]>([]) // Store user's written answers
  const [currentAttempt, setCurrentAttempt] = useState('')
  const [hasAttempted, setHasAttempted] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([])
  const [quizMode, setQuizMode] = useState<'study' | 'test'>('test') // New quiz mode

  useEffect(() => {
    // Shuffle flashcards for random order
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setUserAnswers(new Array(shuffled.length).fill(null))
    setUserAttempts(new Array(shuffled.length).fill(''))
  }, [flashcards])

  const currentCard = shuffledCards[currentIndex]
  const progress = ((currentIndex + 1) / shuffledCards.length) * 100

  const handleSubmitAttempt = () => {
    if (currentAttempt.trim() === '') return
    
    // Save the user's attempt
    const newAttempts = [...userAttempts]
    newAttempts[currentIndex] = currentAttempt.trim()
    setUserAttempts(newAttempts)
    setHasAttempted(true)
    setShowAnswer(true)
  }

  const handleAnswer = (isCorrect: boolean) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentIndex] = isCorrect ? 'correct' : 'incorrect'
    setUserAnswers(newAnswers)

    // Auto advance after a short delay
    setTimeout(() => {
      if (currentIndex < shuffledCards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
        setHasAttempted(false)
        setCurrentAttempt('')
      } else {
        setQuizComplete(true)
      }
    }, 1000)
  }

  const handleStudyModeAnswer = () => {
    setShowAnswer(!showAnswer)
  }

  const getQuizResults = (): QuizResult => {
    const correct = userAnswers.filter(answer => answer === 'correct').length
    const incorrect = userAnswers.filter(answer => answer === 'incorrect').length
    const total = shuffledCards.length
    const percentage = Math.round((correct / total) * 100)

    return { correct, incorrect, total, percentage }
  }

  const restartQuiz = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setHasAttempted(false)
    setCurrentAttempt('')
    setUserAnswers(new Array(shuffledCards.length).fill(null))
    setUserAttempts(new Array(shuffledCards.length).fill(''))
    setQuizComplete(false)
    // Reshuffle cards
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }

  const goToNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setHasAttempted(false)
      setCurrentAttempt('')
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
      setHasAttempted(false)
      setCurrentAttempt('')
    }
  }

  if (shuffledCards.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No flashcards available for quiz.</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    )
  }

  if (quizComplete) {
    const results = getQuizResults()
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Summary */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {results.percentage}%
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{results.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{results.incorrect}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{results.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Performance Message */}
          <div className="text-center p-4 rounded-lg bg-gray-50">
            {results.percentage >= 90 && (
              <p className="text-green-600 font-medium">🎉 Excellent! You've mastered this material!</p>
            )}
            {results.percentage >= 70 && results.percentage < 90 && (
              <p className="text-blue-600 font-medium">👍 Good job! Keep practicing to improve further.</p>
            )}
            {results.percentage >= 50 && results.percentage < 70 && (
              <p className="text-yellow-600 font-medium">📚 Not bad! Review the material and try again.</p>
            )}
            {results.percentage < 50 && (
              <p className="text-red-600 font-medium">📖 Keep studying! Practice makes perfect.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={restartQuiz} className="bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={onClose}>
              Back to Study Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle className="text-xl">Flashcard Quiz</CardTitle>
            <CardDescription>
              Card {currentIndex + 1} of {shuffledCards.length}
            </CardDescription>
          </div>
          <Button onClick={onClose} className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Exit Quiz
          </Button>
        </div>
        
        {/* Quiz Mode Selection */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={quizMode === 'test' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuizMode('test')}
            className="flex items-center gap-2"
          >
            <PenTool className="h-4 w-4" />
            Test Mode
          </Button>
          <Button
            variant={quizMode === 'study' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuizMode('study')}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Study Mode
          </Button>
        </div>
        
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Card */}
        <div className="min-h-[300px] flex flex-col justify-center">
          {/* Subject Badge */}
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{currentCard.subject}</Badge>
            <Badge 
              variant={currentCard.difficulty === 'hard' ? 'destructive' : currentCard.difficulty === 'medium' ? 'default' : 'secondary'}
            >
              {currentCard.difficulty}
            </Badge>
          </div>

          {/* Question */}
          <div className="text-center space-y-4">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Question:</h3>
              <p className="text-gray-800">{currentCard.question}</p>
            </div>

            {/* Test Mode - Answer Input */}
            {quizMode === 'test' && !hasAttempted && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Answer:</label>
                  <Textarea
                    value={currentAttempt}
                    onChange={(e) => setCurrentAttempt(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSubmitAttempt()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Ctrl+Enter or click Submit to reveal the answer
                  </p>
                </div>
                <Button 
                  onClick={handleSubmitAttempt}
                  disabled={!currentAttempt.trim()}
                  className="w-full"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            )}

            {/* Study Mode - Show Answer Button */}
            {quizMode === 'study' && !showAnswer && (
              <Button 
                onClick={handleStudyModeAnswer}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show Answer
              </Button>
            )}

            {/* Answer Revealed */}
            {showAnswer && (
              <div className="space-y-4">
                {/* User's Attempt (Test Mode Only) */}
                {quizMode === 'test' && hasAttempted && (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Your Answer:</h3>
                    <p className="text-blue-700">{userAttempts[currentIndex]}</p>
                  </div>
                )}
                
                {/* Correct Answer */}
                <div className="p-6 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Correct Answer:</h3>
                  <p className="text-gray-800">{currentCard.answer}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Buttons */}
        {showAnswer && userAnswers[currentIndex] === null && (
          <div className="space-y-4">
            {quizMode === 'test' && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  How did you do? Compare your answer with the correct one above.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="flex-1 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                {quizMode === 'test' ? 'I got it wrong' : 'Incorrect'}
              </Button>
              <Button 
                onClick={() => handleAnswer(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {quizMode === 'test' ? 'I got it right' : 'Correct'}
              </Button>
            </div>
          </div>
        )}

        {/* Result Feedback */}
        {userAnswers[currentIndex] !== null && (
          <div className={`text-center p-4 rounded-lg ${
            userAnswers[currentIndex] === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {userAnswers[currentIndex] === 'correct' ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Correct! Well done!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Incorrect. Review this topic.</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">
              {userAnswers.filter(a => a !== null).length} / {shuffledCards.length} answered
            </div>
            <div className="text-xs text-gray-400">
              {quizMode === 'test' ? 'Test Mode' : 'Study Mode'}
            </div>
          </div>
          
          <Button 
            onClick={goToNext}
            disabled={currentIndex === shuffledCards.length - 1}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}