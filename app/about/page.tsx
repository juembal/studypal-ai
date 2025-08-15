import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Target, ArrowRight, Calendar, Star, TrendingUp, Zap, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const coreFeatures = [
  {
    title: 'AI-Powered Intelligence',
    description: 'Advanced AI analyzes your learning patterns and creates optimized study plans that adapt to your unique needs.',
    icon: Brain,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Personalized Learning',
    description: 'Every study plan is tailored to your subjects, weak areas, available time, and preferred learning style.',
    icon: Target,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Smart Scheduling',
    description: 'Automatically optimizes your study schedule to avoid conflicts and maximize learning efficiency.',
    icon: Calendar,
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed analytics and adaptive recommendations.',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-500'
  }
]

const benefits = [
  {
    title: 'Save Time',
    description: 'Reduce study planning time with AI-generated schedules',
    icon: Zap
  },
  {
    title: 'Better Results',
    description: 'Improve retention and test performance with structured learning',
    icon: Star
  },
  {
    title: 'Stay Organized',
    description: 'Never miss important topics with intelligent prioritization',
    icon: CheckCircle
  }
]

export default function About() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-slide-up space-y-8">
              {/* Logo Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative p-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl">
                    <div className="book-simple w-16 h-16 cursor-pointer relative">
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
                          <g className="text-lines opacity-80">
                            <line x1="4" y1="12" x2="12" y2="12" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="4" y1="14" x2="11" y2="14" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="4" y1="16" x2="13" y2="16" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="4" y1="18" x2="10" y2="18" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                          </g>
                          
                          {/* Text Lines - Right */}
                          <g className="text-lines opacity-80">
                            <line x1="20" y1="12" x2="28" y2="12" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="20" y1="14" x2="27" y2="14" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="20" y1="16" x2="29" y2="16" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                            <line x1="20" y1="18" x2="26" y2="18" stroke="rgba(59,130,246,0.8)" strokeWidth="0.8"/>
                          </g>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Heading */}
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold font-heading">
                  About <span className="text-gray-900">Study</span><span className="text-gradient">Pal</span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Your intelligent AI study companion that transforms how you learn
                </p>
              </div>

              {/* Mission Statement */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 max-w-3xl mx-auto">
                <p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
                  StudyPal creates <span className="font-semibold text-blue-600">personalized study plans</span>, 
                  optimizes your schedule, and helps you focus on areas that need the most attention. 
                  Join thousands of students who have transformed their learning with AI-powered study strategies.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 font-heading">
                Core Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Powerful AI-driven tools designed to transform your learning experience
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {coreFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <Card key={index} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                      <div className="relative mb-6">
                        <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                        <div className={`relative p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit mx-auto shadow-lg`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold mb-3 font-heading text-gray-900">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 font-heading">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Four simple steps to transform your study routine
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Tell Us About You",
                  description: "Share your subjects, available study time, learning preferences, and upcoming exams.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  step: "2", 
                  title: "AI Analysis",
                  description: "Our AI analyzes your input and identifies the optimal study approach for your unique situation.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  step: "3",
                  title: "Get Your Plan", 
                  description: "Receive a detailed, personalized study schedule with specific tasks and time allocations.",
                  gradient: "from-amber-500 to-orange-500"
                },
                {
                  step: "4",
                  title: "Track Progress",
                  description: "Follow your plan, track your progress, and let AI adjust recommendations as you improve.",
                  gradient: "from-purple-500 to-pink-500"
                }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-8">
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                    <div className={`relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${item.gradient} rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <span className="text-white text-2xl font-bold">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 font-heading">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-16 border border-white/20 shadow-2xl">
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 font-heading">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl lg:text-2xl text-white/95 mb-12 leading-relaxed max-w-3xl mx-auto">
                Start your journey to academic success with AI-powered personalized study plans 
                designed to help you learn more efficiently and effectively.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button asChild size="lg" className="text-lg px-12 py-6 bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-xl btn-enhanced transform hover:scale-105 transition-all duration-300 rounded-2xl">
                  <Link href="/study-assistant">
                    Create Your Study Plan <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="text-lg px-12 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold backdrop-blur-sm rounded-2xl">
                  <Link href="/examples">
                    View Examples <Star className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}