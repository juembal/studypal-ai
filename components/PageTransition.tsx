'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div 
      className={`transition-all duration-500 ease-out transform ${
        isTransitioning 
          ? 'opacity-0 translate-y-6' 
          : 'opacity-100 translate-y-0'
      }`}
    >
      {children}
    </div>
  )
}