import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Brain, Users, Zap, Target, Heart, ArrowRight, Calendar, Star } from 'lucide-react'
import Link from 'next/link'

const teamMembers = [
  {
    name: 'Dr. Sarah Chen',
    role: 'AI Research Lead',
    description: 'PhD in Machine Learning from Stanford. Specializes in educational AI and personalized learning systems.',
    icon: Brain
  },
  {
    name: 'Michael Rodriguez',
    role: 'Education Specialist',
    description: 'Former high school teacher with 15+ years experience. Expert in curriculum design and study methodologies.',
    icon: GraduationCap
  },
  {
    name: 'Emily Johnson',
    role: 'Product Designer',
    description: 'UX/UI designer focused on creating intuitive educational tools that enhance learning experiences.',
    icon: Heart
  },
  {
    name: 'David Kim',
    role: 'Software Engineer',
    description: 'Full-stack developer with expertise in AI integration and scalable web applications.',
    icon: Zap
  }
]

const features = [
  {
    title: 'AI-Powered Intelligence',
    description: 'Our advanced AI analyzes your learning patterns, subjects, and goals to create optimized study plans that adapt to your unique needs.',
    icon: Brain,
    color: 'blue'
  },
  {
    title: 'Evidence-Based Methods',
    description: 'Built on proven educational research and cognitive science principles to maximize retention and learning efficiency.',
    icon: Target,
    color: 'green'
  },
  {
    title: 'Personalized Experience',
    description: 'Every study plan is tailored to your specific subjects, weak areas, available time, and preferred learning style.',
    icon: Users,
    color: 'amber'
  },
  {
    title: 'Continuous Improvement',
    description: 'Our AI learns from thousands of successful study plans to continuously improve recommendations and strategies.',
    icon: Zap,
    color: 'yellow'
  }
]

export default function About() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-24 z-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="animate-slide-up">
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-3xl shadow-2xl">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-8 font-heading">
                About <span className="text-studypal-gray-900">Study</span><span className="text-gradient">Pal</span>
              </h1>
              <p className="text-2xl text-studypal-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                Your intelligent AI study companion that transforms how you learn
              </p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
                <p className="text-lg text-studypal-gray-700 leading-relaxed">
                  StudyPal creates personalized study plans, optimizes your schedule, and helps you focus on areas that need the most attention. 
                  Join thousands of students who have transformed their learning with AI-powered study strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-studypal-gray-900 font-heading">What We Do</h2>
              <p className="text-xl text-studypal-gray-600 max-w-3xl mx-auto leading-relaxed">
                Revolutionizing education through intelligent AI-powered study solutions
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-xl mr-4">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-studypal-gray-900">AI-Powered Analysis</h3>
                  </div>
                  <p className="text-studypal-gray-600 leading-relaxed">
                    Our advanced AI analyzes your learning patterns, available time, and academic goals to create the most effective study approach.
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-studypal-green to-studypal-green/80 rounded-xl mr-4">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-studypal-gray-900">Personalized Plans</h3>
                  </div>
                  <p className="text-studypal-gray-600 leading-relaxed">
                    Every study plan is tailored to your specific subjects, weak areas, and learning preferences for maximum efficiency.
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-studypal-blue/10 to-studypal-cyan/10 rounded-3xl p-8 lg:p-12">
                <h3 className="text-2xl font-bold text-studypal-gray-900 mb-6">Our Mission</h3>
                <p className="text-lg text-studypal-gray-700 leading-relaxed mb-6">
                  We combine cutting-edge artificial intelligence with proven educational methodologies to help students achieve better results in less time.
                </p>
                <p className="text-lg text-studypal-gray-700 leading-relaxed">
                  StudyPal transforms the way you learn by creating customized study plans that adapt to your unique needs and maximize your learning potential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-studypal-gray-900 font-heading">How It Works</h2>
              <p className="text-xl text-studypal-gray-500 max-w-3xl mx-auto leading-relaxed">
                Four simple steps to transform your study routine
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-full group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-xl font-bold">1</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-studypal-gray-900 font-heading">Tell Us About You</h3>
                <p className="text-studypal-gray-600 leading-relaxed">
                  Share your subjects, available study time, learning preferences, and upcoming exams.
                </p>
              </div>
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-green to-studypal-green/80 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-studypal-green to-studypal-green/80 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-xl font-bold">2</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-studypal-gray-900 font-heading">AI Analysis</h3>
                <p className="text-studypal-gray-600 leading-relaxed">
                  Our AI analyzes your input and identifies the optimal study approach for your unique situation.
                </p>
              </div>
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-amber to-studypal-amber/80 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-studypal-amber to-studypal-amber/80 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-xl font-bold">3</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-studypal-gray-900 font-heading">Get Your Plan</h3>
                <p className="text-studypal-gray-600 leading-relaxed">
                  Receive a detailed, personalized study schedule with specific tasks and time allocations.
                </p>
              </div>
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-studypal-cyan to-studypal-blue rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-studypal-cyan to-studypal-blue rounded-full group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-xl font-bold">4</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-studypal-gray-900 font-heading">Track Progress</h3>
                <p className="text-studypal-gray-600 leading-relaxed">
                  Follow your plan, track your progress, and let AI adjust recommendations as you improve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-studypal-gray-900 font-heading">Core Features</h2>
              <p className="text-xl text-studypal-gray-600 max-w-3xl mx-auto leading-relaxed">
                Powerful AI-driven tools designed to transform your learning experience
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-2xl w-fit mx-auto">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 font-heading">AI Study Plan Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-studypal-gray-500 leading-relaxed">
                    Creates personalized study schedules based on your learning style and goals.
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
                    Automatically avoids scheduling conflicts and optimizes your available time.
                  </p>
                </CardContent>
              </Card>

              <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-studypal-amber to-studypal-amber/80 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-studypal-amber to-studypal-amber/80 rounded-2xl w-fit mx-auto">
                      <Target className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 font-heading">Weak Area Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-studypal-gray-500 leading-relaxed">
                    Identifies and prioritizes subjects or topics that need extra attention.
                  </p>
                </CardContent>
              </Card>

              <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-studypal-cyan to-studypal-blue rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-studypal-cyan to-studypal-blue rounded-2xl w-fit mx-auto">
                      <Star className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 font-heading">Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-studypal-gray-500 leading-relaxed">
                    Monitor your study progress and receive insights on your learning patterns.
                  </p>
                </CardContent>
              </Card>

              <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-studypal-blue to-studypal-cyan rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-studypal-blue to-studypal-cyan rounded-2xl w-fit mx-auto">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 font-heading">24/7 AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-studypal-gray-500 leading-relaxed">
                    Get instant help and study tips whenever you need them.
                  </p>
                </CardContent>
              </Card>

              <Card className="group text-center border-0 glass-effect hover-lift hover-glow transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-studypal-green to-studypal-green/80 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-studypal-green to-studypal-green/80 rounded-2xl w-fit mx-auto">
                      <Zap className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 font-heading">Adaptive Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-studypal-gray-500 leading-relaxed">
                    Plans automatically adjust based on your progress and changing needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-br from-studypal-blue via-studypal-cyan to-studypal-blue relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 font-heading">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-white/95 mb-10 leading-relaxed">
                Join thousands of students who have revolutionized their study habits with AI-powered personalized plans. 
                Start your journey to academic success today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="text-lg px-10 py-6 bg-studypal-amber hover:bg-studypal-amber/90 text-studypal-gray-900 font-bold shadow-xl btn-enhanced font-mono-ui transform hover:scale-105 transition-all duration-300">
                  <Link href="/study-assistant">
                    Create Your Study Plan <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="text-lg px-10 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold backdrop-blur-sm">
                  <Link href="/examples">
                    View Showcase <Star className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <div className="mt-8 flex justify-center items-center space-x-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10,000+</div>
                  <div className="text-sm">Students Helped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">AI Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}