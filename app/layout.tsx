import type { Metadata } from 'next'
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatbotWrapper from '@/components/ChatbotWrapper'
import PageTransition from '@/components/PageTransition'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})
const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: 'StudyPal - Your AI-Powered Study Companion',
  description: 'Generate personalized study plans, revision schedules, and learning tips powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-studypal-gray-50 via-studypal-blue/5 to-studypal-cyan/10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <Navbar />
          <main className="flex-1 relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
          <ChatbotWrapper />
        </div>
      </body>
    </html>
  )
}