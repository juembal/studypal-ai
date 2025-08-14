'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GraduationCap, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Study Assistant', href: '/study-assistant' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Showcase', href: '/examples' },
  { name: 'About', href: '/about' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300",
      isScrolled 
        ? "glass-effect border-b border-white/20 bg-white/90 shadow-sm" 
        : "bg-white/10"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-xl shadow-lg">
                  <div className="book-simple w-8 h-8 cursor-pointer relative">
                    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                      {/* Open Book - Default State */}
                      <g className="open-book transition-all duration-500 ease-in-out group-hover:opacity-0 group-hover:scale-90">
                        {/* Left Page */}
                        <path 
                          d="M2 8 C2 6 4 6 6 6 C10 6 14 8 16 10 L16 26 C14 24 10 22 6 22 C4 22 2 22 2 24 Z" 
                          fill="white" 
                          stroke="rgba(255,255,255,0.8)" 
                          strokeWidth="0.5"
                          className="transition-all duration-500 ease-in-out group-hover:transform group-hover:-rotate-12 group-hover:translate-x-1"
                        />
                        
                        {/* Right Page */}
                        <path 
                          d="M30 8 C30 6 28 6 26 6 C22 6 18 8 16 10 L16 26 C18 24 22 22 26 22 C28 22 30 22 30 24 Z" 
                          fill="white" 
                          stroke="rgba(255,255,255,0.8)" 
                          strokeWidth="0.5"
                          className="transition-all duration-500 ease-in-out group-hover:transform group-hover:rotate-12 group-hover:-translate-x-1"
                        />
                        
                        {/* Text Lines - Left */}
                        <g className="text-lines opacity-60 transition-opacity duration-500 group-hover:opacity-20">
                          <line x1="4" y1="12" x2="12" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="14" x2="11" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="16" x2="13" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="4" y1="18" x2="10" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                        </g>
                        
                        {/* Text Lines - Right */}
                        <g className="text-lines opacity-60 transition-opacity duration-500 group-hover:opacity-20">
                          <line x1="20" y1="12" x2="28" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="14" x2="27" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="16" x2="29" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                          <line x1="20" y1="18" x2="26" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5"/>
                        </g>
                      </g>
                      
                      {/* Closed Book - Hover State */}
                      <g className="closed-book opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-105">
                        {/* Book Cover */}
                        <rect 
                          x="8" y="6" width="16" height="20" rx="1" 
                          fill="white" 
                          stroke="rgba(255,255,255,0.9)" 
                          strokeWidth="1"
                        />
                        
                        {/* Book Spine */}
                        <rect x="7" y="6" width="2" height="20" rx="0.5" fill="rgba(255,255,255,0.9)"/>
                        
                        {/* Cover Title */}
                        <rect x="10" y="10" width="12" height="2" rx="0.5" fill="rgba(59,130,246,0.8)"/>
                        <rect x="11" y="14" width="10" height="0.5" rx="0.25" fill="rgba(255,255,255,0.6)"/>
                        <rect x="12" y="16" width="8" height="0.5" rx="0.25" fill="rgba(255,255,255,0.6)"/>
                        
                        {/* Corner Details */}
                        <circle cx="10" cy="22" r="0.5" fill="rgba(255,255,255,0.4)"/>
                        <circle cx="22" cy="22" r="0.5" fill="rgba(255,255,255,0.4)"/>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <span className="text-xl font-bold font-heading">
                <span className="text-studypal-gray-900">Study</span>
                <span className="bg-gradient-to-r from-studypal-blue to-studypal-cyan bg-clip-text text-transparent">Pal</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group',
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                    ? 'text-studypal-blue bg-studypal-blue/10'
                    : 'text-studypal-gray-900 hover:text-studypal-blue hover:bg-studypal-blue/5'
                )}
              >
                <span className="relative z-10">{item.name}</span>
                {(pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue/20 to-studypal-cyan/20 opacity-50"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-studypal-blue/5 transition-colors duration-300"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass-effect border-t border-white/20">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-4 py-3 text-base font-medium rounded-xl transition-all duration-300',
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                    ? 'text-studypal-blue bg-studypal-blue/10'
                    : 'text-studypal-gray-900 hover:text-studypal-blue hover:bg-studypal-blue/5'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}