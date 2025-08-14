'use client'

import { useState } from 'react'
import Chatbot from './Chatbot'

export default function ChatbotWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <Chatbot 
      isOpen={isChatOpen} 
      onToggle={() => setIsChatOpen(!isChatOpen)} 
    />
  )
}