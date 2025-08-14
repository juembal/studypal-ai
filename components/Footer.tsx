import Link from 'next/link'
import { GraduationCap, Github, Twitter, Mail, Zap, Code, Brain } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          {/* 1. Brand & Tagline */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold">StudyPal AI</span>
                <p className="text-sm text-blue-400 font-medium">Transform Your Learning Journey</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-lg leading-relaxed">
              Your intelligent AI study companion that creates personalized study plans, 
              optimizes your schedule, and helps you achieve academic excellence.
            </p>

            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Tech Stack - Right Side */}
          <div className="flex-shrink-0 text-right">
            <p className="text-sm text-gray-400">
              Powered by <span className="text-blue-400 font-medium">Groq AI (Llama 3)</span>
            </p>
            <div className="flex items-center justify-end mt-1">
              <span className="text-gray-500 text-xs mx-2">|</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Built with <span className="text-cyan-400">Next.js</span>, <span className="text-green-400">TypeScript</span>, <span className="text-purple-400">Tailwind CSS</span>
            </p>
          </div>
        </div>

        {/* 5. Copyright */}
        <div className="border-t border-gray-800 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 StudyPal AI. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-2 md:mt-0">
              Built with ❤️ by juembal for students worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}