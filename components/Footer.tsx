import Link from 'next/link'
import { Github, Mail, Heart, User } from 'lucide-react'

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Study Assistant', href: '/study-assistant' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Showcase', href: '/examples' },
    { name: 'About', href: '/about' },
  ],
  social: [
    {
      name: 'GitHub',
      href: 'https://github.com/juembal',
      icon: Github,
    },
    {
      name: 'Portfolio',
      href: 'https://joem-balingit.netlify.app/',
      icon: User,
    },
    {
      name: 'Email',
      href: 'mailto:joembalingit15@gmail.com',
      icon: Mail,
    },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-sm opacity-75"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <div className="book-simple w-7 h-7 cursor-pointer relative">
                    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                      {/* Open Book */}
                      <g className="open-book">
                        {/* Left Page */}
                        <path 
                          d="M2 8 C2 6 4 6 6 6 C10 6 14 8 16 10 L16 26 C14 24 10 22 6 22 C4 22 2 22 2 24 Z" 
                          fill="white" 
                          stroke="rgba(255,255,255,0.8)" 
                          strokeWidth="0.5"
                        />
                        
                        {/* Right Page */}
                        <path 
                          d="M30 8 C30 6 28 6 26 6 C22 6 18 8 16 10 L16 26 C18 24 22 22 26 22 C28 22 30 22 30 24 Z" 
                          fill="white" 
                          stroke="rgba(255,255,255,0.8)" 
                          strokeWidth="0.5"
                        />
                        
                        {/* Text Lines - Left */}
                        <g className="text-lines opacity-60">
                          <line x1="4" y1="12" x2="12" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="14" x2="11" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="16" x2="13" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="18" x2="10" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                        </g>
                        
                        {/* Text Lines - Right */}
                        <g className="text-lines opacity-60">
                          <line x1="20" y1="12" x2="28" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="14" x2="27" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="16" x2="29" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="18" x2="26" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                        </g>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold font-heading text-white">
                  Study<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Pal</span>
                </span>
                <p className="text-sm text-blue-400 font-medium">AI-Powered Study Companion</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 sm:mb-8 max-w-md leading-relaxed text-sm sm:text-base">
              Transform your learning journey with personalized AI-generated study plans, 
              smart scheduling, and intelligent progress tracking.
            </p>

            {/* Social Links */}
            <div className="flex space-x-6">
              {navigation.social.map((item) => {
                const IconComponent = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target={item.href.startsWith('mailto:') ? '_self' : '_blank'}
                    rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                    aria-label={item.name}
                  >
                    <IconComponent className="h-6 w-6" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 font-heading">Navigation</h3>
            <ul className="space-y-4">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-300 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 font-heading">Technology</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-2">Powered by</p>
                <p className="text-blue-400 font-medium text-sm">Groq AI (Llama 3)</p>
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-2">Built with</p>
                <div className="space-y-1">
                  <p className="text-cyan-400 text-sm">Next.js</p>
                  <p className="text-green-400 text-sm">TypeScript</p>
                  <p className="text-purple-400 text-sm">Tailwind CSS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 StudyPal AI. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <span>Built with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>by juembal for students worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}