'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChatMessage, StudyPalChatbot } from '@/lib/chatbot'
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ChatbotProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm PalBot, your friendly study assistant. I can help you with study tips, answer questions about your subjects, or provide motivation. What would you like to know?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const context = StudyPalChatbot.generateChatContext()
      const response = await axios.post('/api/chat', {
        message: text,
        context,
        conversationHistory: messages
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickSuggestions = StudyPalChatbot.getQuickSuggestions(
    StudyPalChatbot.generateChatContext()
  )

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={onToggle}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/80 hover:to-studypal-cyan/80 shadow-glow hover:shadow-glow-xl transition-all duration-300 hover:scale-125 animate-float transform active:scale-95 hover:rotate-12 hover:shadow-blue-500/50"
          size="icon"
        >
          <MessageCircle className="h-7 w-7 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:animate-bounce" />
        </Button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse group-hover:scale-125 group-hover:bg-green-400 transition-all duration-300"></div>
        
        {/* Hover ripple effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-studypal-blue/20 to-studypal-cyan/20 scale-0 group-hover:scale-150 transition-transform duration-500 ease-out pointer-events-none"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
        </div>
      </div>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 shadow-xl hover:shadow-2xl z-50 transition-all duration-500 ease-in-out transform hover:scale-[1.02] ${
      isMinimized ? 'h-16' : 'h-[500px]'
    } animate-slide-up`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-t-lg" 
                  onClick={() => setIsMinimized(!isMinimized)}>
        <CardTitle className="text-lg flex items-center gap-2 group">
          <Bot className="h-5 w-5 text-blue-600 group-hover:text-studypal-cyan transition-colors duration-200 group-hover:animate-pulse" />
          <span className="group-hover:text-studypal-blue transition-colors duration-200">PalBot</span>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 hover:scale-110" onClick={(e) => {
            e.stopPropagation()
            setIsMinimized(!isMinimized)
          }}>
            {isMinimized ? <Maximize2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" /> : <Minimize2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-110" onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}>
            <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
          </Button>
        </div>
      </CardHeader>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isMinimized ? 'max-h-0 opacity-0' : 'max-h-[420px] opacity-100'
      }`}>
        <CardContent className="flex flex-col h-[420px] p-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-1">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-300 hover:shadow-lg break-words overflow-hidden ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-studypal-blue to-studypal-cyan text-white shadow-md hover:shadow-blue-200' 
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm hover:shadow-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-full flex items-center justify-center mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-0.5">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className={`flex-1 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      <div 
                        className="text-sm leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, `<strong class="${message.role === 'user' ? 'text-white font-semibold' : 'text-studypal-blue font-semibold'}">$1</strong>`)
                            .replace(/\*(.*?)\*/g, `<em class="${message.role === 'user' ? 'text-white/90' : 'text-gray-700'}">$1</em>`)
                            .replace(/`(.*?)`/g, `<code class="${message.role === 'user' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded text-xs font-mono">$1</code>`)
                            .replace(/\n\n/g, '<br><br>')
                            .replace(/\n/g, '<br>')
                        }} 
                      />
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start group">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-full flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-studypal-blue" />
                      <span className="text-sm text-gray-600 font-medium">PalBot is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.map((suggestion, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about studying..."
              disabled={isLoading}
              className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <Button 
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Send className="h-4 w-4 transition-transform duration-200 hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}