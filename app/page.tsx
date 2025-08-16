'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Brain, Calendar, Target, ArrowRight, Star, Users, Zap, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Global Gradient Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large flowing gradient blobs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-studypal-blue/30 to-studypal-cyan/40 rounded-full blur-3xl animate-float opacity-80" style={{animationDelay: '0s', animationDuration: '20s'}}></div>
        <div className="absolute top-20 -right-40 w-96 h-96 bg-gradient-to-bl from-studypal-green/35 to-studypal-green/25 rounded-full blur-3xl animate-float opacity-70" style={{animationDelay: '5s', animationDuration: '25s'}}></div>
        <div className="absolute -bottom-40 left-1/4 w-72 h-72 bg-gradient-to-tr from-studypal-amber/30 to-studypal-amber/40 rounded-full blur-3xl animate-float opacity-75" style={{animationDelay: '10s', animationDuration: '30s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-tl from-studypal-cyan/25 to-studypal-blue/35 rounded-full blur-3xl animate-float opacity-65" style={{animationDelay: '15s', animationDuration: '22s'}}></div>
        
        {/* Medium morphing blobs */}
        <div className="absolute top-1/2 -left-20 w-48 h-48 bg-gradient-to-r from-studypal-green/30 to-studypal-cyan/30 rounded-full blur-2xl animate-float opacity-60" style={{animationDelay: '3s', animationDuration: '18s'}}></div>
        <div className="absolute bottom-1/4 right-10 w-56 h-56 bg-gradient-to-l from-studypal-blue/25 to-studypal-amber/30 rounded-full blur-2xl animate-float opacity-55" style={{animationDelay: '8s', animationDuration: '28s'}}></div>
        <div className="absolute top-10 left-1/3 w-40 h-40 bg-gradient-to-br from-studypal-amber/25 to-studypal-green/30 rounded-full blur-2xl animate-float opacity-50" style={{animationDelay: '12s', animationDuration: '24s'}}></div>
        
        {/* Small accent blobs */}
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-tr from-studypal-cyan/30 to-studypal-blue/25 rounded-full blur-xl animate-float opacity-45" style={{animationDelay: '6s', animationDuration: '16s'}}></div>
        <div className="absolute top-40 right-1/3 w-36 h-36 bg-gradient-to-bl from-studypal-green/25 to-studypal-amber/25 rounded-full blur-xl animate-float opacity-40" style={{animationDelay: '14s', animationDuration: '20s'}}></div>
        
        {/* Additional blobs for more coverage */}
        <div className="absolute top-3/4 left-1/2 w-60 h-60 bg-gradient-to-br from-studypal-blue/20 to-studypal-cyan/25 rounded-full blur-3xl animate-float opacity-50" style={{animationDelay: '7s', animationDuration: '26s'}}></div>
        <div className="absolute bottom-1/3 -right-20 w-44 h-44 bg-gradient-to-tl from-studypal-green/25 to-studypal-amber/20 rounded-full blur-2xl animate-float opacity-45" style={{animationDelay: '11s', animationDuration: '24s'}}></div>
      </div>
      
      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 pointer-events-none z-10"></div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-24 z-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-6xl mx-auto">
            
            <div className="animate-slide-up">
              {/* Main Headline */}
              <div className="mb-12">
                {/* Visual Icons */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-xl sm:rounded-2xl shadow-lg animate-float" style={{animationDelay: '0s'}}>
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-studypal-green to-studypal-green/80 rounded-xl sm:rounded-2xl shadow-lg animate-float" style={{animationDelay: '1s'}}>
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-studypal-amber to-studypal-amber/80 rounded-xl sm:rounded-2xl shadow-lg animate-float" style={{animationDelay: '2s'}}>
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight font-heading">
                  <span className="text-studypal-gray-600">Master</span><br/>
                  <span className="text-gradient">Study Success</span><br/>
                  <span className="text-studypal-gray-600">with AI</span>
                </h1>
                
                <p className="text-lg sm:text-xl lg:text-2xl text-studypal-gray-500 leading-relaxed max-w-4xl mx-auto mt-8 px-4">
                  AI-powered study plans that adapt to your learning style and schedule
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16 px-4">
                <Button asChild size="lg" className="w-full sm:w-auto text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 bg-gradient-to-r from-studypal-blue to-studypal-cyan hover:from-studypal-blue/90 hover:to-studypal-cyan/90 shadow-glow btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
                  <Link href="/study-assistant">
                    Create Study Plan <ArrowRight className="ml-2 sm:ml-3 h-5 sm:h-6 w-5 sm:w-6" />
                  </Link>
                </Button>
                <Button asChild size="lg" className="w-full sm:w-auto text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced transform hover:scale-105 transition-all duration-300 font-mono-ui">
                  <Link href="/examples">
                    View Showcase
                  </Link>
                </Button>
              </div>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-sm sm:text-base lg:text-lg mb-12 px-4">
                <div className="flex items-center gap-2 sm:gap-3 bg-white backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg border border-studypal-blue/30">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-studypal-blue rounded-full animate-pulse"></div>
                  <span className="font-semibold text-studypal-gray-700 font-mono-ui">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg border border-studypal-green/30">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-studypal-green rounded-full animate-pulse"></div>
                  <span className="font-semibold text-studypal-gray-700 font-mono-ui">Free to Start</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg border border-studypal-amber/30">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 bg-studypal-amber rounded-full animate-pulse"></div>
                  <span className="font-semibold text-studypal-gray-700 font-mono-ui">Instant Results</span>
                </div>
              </div>

              {/* Why Choose Button */}
              <div className="text-center">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                      const featuresSection = document.getElementById('features-section');
                      if (featuresSection) {
                        const rect = featuresSection.getBoundingClientRect();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        const targetPosition = rect.top + scrollTop - 80; // 96px navbar - adjusted for removed stats section
                        
                        window.scrollTo({
                          top: targetPosition,
                          behavior: 'smooth'
                        });
                      }
                    }, 100);
                  }}
                  className="group inline-flex items-center gap-2 text-studypal-gray-600 hover:text-studypal-blue transition-all duration-300 text-lg font-medium"
                >
                  <span>Why Choose StudyPal?</span>
                  <ArrowRight className="h-5 w-5 rotate-90 group-hover:translate-y-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-24 mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 id="why-choose-heading" className="text-4xl lg:text-5xl font-bold mb-6 font-heading">
              Why Choose <span className="text-studypal-gray-900">Study</span><span className="text-gradient">Pal</span>?
            </h2>
            <p className="text-xl text-studypal-gray-500 max-w-3xl mx-auto leading-relaxed">
              Everything you need for effective, organized studying
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto px-4">
            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-2xl w-fit mx-auto">
                    <Brain className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Personalized Study Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  AI-tailored schedules based on subjects, hours, and weak areas.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-green to-studypal-green/80 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-studypal-green to-studypal-green/80 rounded-2xl w-fit mx-auto">
                    <Calendar className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Conflict-Free Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  Automatically avoids overlapping study sessions.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl w-fit mx-auto">
                    <Target className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Subject Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  Focuses on subjects you want to prioritize and master.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-fit mx-auto">
                    <Zap className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Flexible Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  Update your schedule anytime, AI rebalances instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-amber to-studypal-amber/80 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-studypal-amber to-studypal-amber/80 rounded-2xl w-fit mx-auto">
                    <TrendingUp className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Motivation Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  Track your progress and stay consistent.
                </p>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl w-fit mx-auto">
                    <Star className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3 font-heading">Free to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-studypal-gray-500 leading-relaxed">
                  No hidden fees for students.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-studypal-blue to-studypal-cyan relative z-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Ready to Transform Your Study Routine?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 px-4">
              Start your personalized learning journey with StudyPal's AI-powered study plans tailored to your needs.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-semibold shadow-lg btn-enhanced font-mono-ui">
              <Link href="/study-assistant">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}