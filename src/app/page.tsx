import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { 
  ArrowRight, BookOpen, Shield, Users, Zap, CheckCircle2, 
  MessageSquare, Calendar, ClipboardList, QrCode, CreditCard,
  Mail, MapPin, Phone, Send, Info, Award, Globe, Users2,
  TrendingUp, GraduationCap, ChevronRight, Play, Star, Smartphone, Download
} from 'lucide-react';
import { IMAGES } from '@/app/_lib/utils/images';

export const metadata: Metadata = {
  title: 'Skolic — Smart School Management System',
  description: 'The ultimate SaaS platform for modern schools. Manage attendance, results, timetables, and communication effortlessly with Skolic.',
};

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user && user.status === 'approved') {
    redirect(DASHBOARD_ROUTES[user.role as UserRole]);
  }

  return (
    <div className="bg-bg-primary min-h-screen flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur h-[var(--navbar-height)] flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/images/Skolic logo.png" alt="Skolic" className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-bold text-text-secondary hover:text-accent transition-colors">Home</a>
            <a href="#features" className="text-sm font-bold text-text-secondary hover:text-accent transition-colors">Features</a>
            <a href="#about" className="text-sm font-bold text-text-secondary hover:text-accent transition-colors">About</a>
            <a href="#mobile-app" className="text-sm font-bold text-text-secondary hover:text-accent transition-colors">Mobile App</a>
            <a href="#contact" className="text-sm font-bold text-text-secondary hover:text-accent transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://skolic-app.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download Android App"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Smartphone className="h-4 w-4" /> Get App
            </a>
            <Link href="/login" className="hidden sm:block text-sm font-bold text-text-primary hover:text-accent transition-colors px-4">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="reveal space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-subtle border border-accent/10 text-accent text-xs font-black uppercase tracking-widest">
              <Zap className="h-4 w-4" />
              Revolutionizing Education
            </div>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black text-text-primary leading-[1.05] tracking-tight">
              Smart School <br />
              <span className="text-gradient">Management</span> System
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl font-medium">
              Manage students, teachers, attendance, assignments, results, timetables, and communication in one powerful platform. Built for the modern educational era.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup" className="px-8 py-4 rounded-2xl gradient-bg text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all duration-300">
                Get Started Now <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://skolic-app.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download Android App APK"
                className="px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <Download className="h-5 w-5" /> Download App
              </a>
            </div>
            
            <div className="flex items-center gap-6 pt-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-bg-tertiary flex items-center justify-center overflow-hidden">
                    <Users2 className="h-5 w-5 text-text-tertiary" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-text-secondary">
                Trusted by <span className="text-text-primary">500+</span> Schools Worldwide
              </p>
            </div>
          </div>
          
          <div className="relative reveal" style={{ animationDelay: '200ms' }}>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative glass-card p-4 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
              <img 
                src={IMAGES.HERO} 
                alt="Smart Dashboard" 
                className="rounded-xl w-full h-auto shadow-sm"
              />
              <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 hidden xl:block animate-float">
                <div className="glass-card p-4 shadow-xl border-accent/20 bg-white/90">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-text-tertiary uppercase">Performance</p>
                      <p className="text-sm font-black text-text-primary">+24.5% Increase</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Active Students', val: '50K+', icon: <Users className="text-blue-500" /> },
            { label: 'Expert Teachers', val: '2.5K+', icon: <GraduationCap className="text-purple-500" /> },
            { label: 'Total Classes', val: '800+', icon: <BookOpen className="text-emerald-500" /> },
            { label: 'Attendance Rate', val: '99.9%', icon: <CheckCircle2 className="text-amber-500" /> }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-3xl font-black text-text-primary">{stat.val}</p>
              <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20 reveal">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Core Modules</h2>
            <h3 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
              Powerful Features for <span className="text-gradient">Every Role</span>
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
              Our platform provides tailored experiences for admins, teachers, and students to ensure seamless school operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Attendance Management', desc: 'Real-time tracking of student and teacher presence with automated reporting.', icon: <CheckCircle2 className="text-emerald-500" />, color: 'bg-emerald-50' },
              { title: 'Result Management', desc: 'Secure grade entry and instant report card generation for students.', icon: <ClipboardList className="text-blue-500" />, color: 'bg-blue-50' },
              { title: 'QR Attendance', desc: 'Quick and secure attendance marking via QR code scanning.', icon: <QrCode className="text-purple-500" />, color: 'bg-purple-50' },
              { title: 'Timetable System', desc: 'Smart scheduling for classes, subjects, and exams with conflict detection.', icon: <Calendar className="text-amber-500" />, color: 'bg-amber-50' },
              { title: 'Assignment Module', desc: 'Easily distribute, track, and grade student assignments digitally.', icon: <BookOpen className="text-rose-500" />, color: 'bg-rose-50' },
              { title: 'Live Announcements', desc: 'Broadcast important news to the entire school or specific classes.', icon: <Zap className="text-indigo-500" />, color: 'bg-indigo-50' },
              { title: 'Secure Messaging', desc: 'Integrated chat system for direct communication between school stakeholders.', icon: <MessageSquare className="text-cyan-500" />, color: 'bg-cyan-50' },
              { title: 'Digital ID Cards', desc: 'Generate and manage professional school identity cards instantly.', icon: <CreditCard className="text-orange-500" />, color: 'bg-orange-50' }
            ].map((feat, i) => (
              <div key={i} className="reveal glass-card p-8 group hover:-translate-y-2 transition-all duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`h-14 w-14 rounded-2xl ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                  {feat.icon}
                </div>
                <h4 className="text-lg font-black text-text-primary mb-3 tracking-tight">{feat.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed font-medium">{feat.desc}</p>
                <div className="pt-6">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative reveal">
             <div className="absolute top-10 -left-10 w-full h-full bg-accent/5 rounded-[2rem] -rotate-3" />
             <img 
               src={IMAGES.SCHOOL_MGMT} 
               alt="About Skolic" 
               className="relative rounded-[2rem] shadow-2xl z-10 w-full h-auto"
             />
             <div className="absolute -bottom-6 -right-6 glass-card p-6 shadow-xl z-20 bg-white/90">
               <p className="text-4xl font-black text-accent">10+</p>
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Years of Excellence</p>
             </div>
          </div>
          <div className="reveal space-y-6">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.3em]">About Platform</h2>
            <h3 className="text-4xl font-black text-text-primary tracking-tight leading-tight">
              Leading the Way in <br /> <span className="text-gradient">Educational Technology</span>
            </h3>
            <p className="text-text-secondary leading-relaxed font-medium">
              Skolic is a comprehensive solution designed to bridge the gap between administrative needs and academic excellence. We empower educators to focus on what matters most—teaching—by automating complex management tasks.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                'Centralized Student Information System',
                'Advanced Teacher Workload Management',
                'Transparent Grading & Result Portals',
                'Instant Communication with Parents'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-text-primary">
                  <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-6">
              <Button href="#contact">Learn More About Us</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-bg-tertiary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
             <h3 className="text-3xl md:text-4xl font-black text-text-primary">Why Schools Choose <span className="text-accent">Skolic</span></h3>
             <p className="text-text-secondary font-medium">Premium features that set us apart from generic platforms.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Military Grade Security', desc: 'Your data is protected with the latest encryption standards and secure cloud hosting.', icon: <Shield className="h-8 w-8 text-white" /> },
              { title: 'User Friendly UI', desc: 'An intuitive interface that requires zero training for teachers and administrative staff.', icon: <Award className="h-8 w-8 text-white" /> },
              { title: 'Real-Time Updates', desc: 'Get instant notifications and live updates on attendance, grades, and news.', icon: <Globe className="h-8 w-8 text-white" /> }
            ].map((item, i) => (
              <div key={i} className="reveal card-standard p-10 space-y-6 text-center hover:bg-white transition-all">
                <div className="h-16 w-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  {item.icon}
                </div>
                <h4 className="text-xl font-black text-text-primary">{item.title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Preview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal space-y-6">
              <h3 className="text-4xl font-black text-text-primary tracking-tight">Professional <span className="text-accent">Dashboard</span> Experience</h3>
              <p className="text-text-secondary font-medium leading-relaxed">
                Clean, organized, and data-driven dashboards for every role. Monitor everything from attendance trends to financial reports with just a few clicks.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg-tertiary rounded-xl">
                  <p className="text-2xl font-black text-text-primary">98%</p>
                  <p className="text-[10px] font-black text-text-tertiary uppercase">Admin Satisfaction</p>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-xl">
                  <p className="text-2xl font-black text-text-primary">2x</p>
                  <p className="text-[10px] font-black text-text-tertiary uppercase">Faster Workflow</p>
                </div>
              </div>
            </div>
            <div className="reveal">
              <div className="relative p-2 bg-text-primary rounded-3xl shadow-2xl">
                <img src={IMAGES.CLASSROOM} className="rounded-2xl" alt="Classroom Management" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Specific Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <h3 className="text-4xl font-black text-text-primary">Built for <span className="text-accent">Everyone</span></h3>
            <p className="text-text-secondary font-medium">Empowering every stakeholder in the education ecosystem.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="reveal glass-card overflow-hidden group">
              <div className="h-64 overflow-hidden">
                <img src={IMAGES.STUDENTS} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="For Students" />
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-black text-text-primary mb-4">For Students</h4>
                <p className="text-text-secondary mb-6">Access your digital ID, check results, and receive instant updates on class schedules and assignments.</p>
                <Link href="/signup" className="text-accent font-bold flex items-center gap-2 hover:gap-3 transition-all">Join Your Class <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="reveal glass-card overflow-hidden group" style={{ animationDelay: '200ms' }}>
              <div className="h-64 overflow-hidden">
                <img src={IMAGES.TEACHER} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="For Teachers" />
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-black text-text-primary mb-4">For Teachers</h4>
                <p className="text-text-secondary mb-6">Manage attendance with QR codes, enter grades securely, and communicate directly with students and parents.</p>
                <Link href="/signup" className="text-accent font-bold flex items-center gap-2 hover:gap-3 transition-all">Start Teaching <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black text-text-primary">Trusted by <span className="text-accent">Educators</span></h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Muhammad Umar', role: 'Principal', comment: 'The QR attendance system has saved us hours of manual logging every single morning. Simply revolutionary.' },
              { name: 'Muhammad Ali', role: 'Senior Teacher', comment: 'Uploading results and managing assignments has never been easier. The UI is clean and very easy to use.' },
              { name: 'Ayan Khan', role: 'Admin Officer', comment: 'The security and role-based access give us peace of mind knowing student data is always protected.' }
            ].map((t, i) => (
              <div key={i} className="reveal glass-card p-8 space-y-6 border-white shadow-sm hover:shadow-lg transition-all">
                <div className="flex gap-1 text-amber-500">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-text-secondary italic font-medium">"{t.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-text-primary">{t.name}</p>
                    <p className="text-xs font-black text-accent uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="reveal space-y-8">
              <div>
                <h3 className="text-4xl font-black text-text-primary tracking-tight mb-4">Get In <span className="text-accent">Touch</span></h3>
                <p className="text-text-secondary font-medium">Have questions? We're here to help you modernize your school.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-tertiary uppercase">Email Us</p>
                    <a href="mailto:skolic@gmail.com" className="font-bold text-text-primary hover:text-accent transition-colors">skolic@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-tertiary uppercase">Call Us</p>
                    <a href="tel:+923178923535" className="font-bold text-text-primary hover:text-accent transition-colors">+92 317 8923535</a>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-tertiary uppercase">Location</p>
                    <p className="font-bold text-text-primary">Pakistan</p>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <p className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-widest">Connect Directly</p>
                <a 
                  href="https://wa.me/923178923535" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] text-white font-black shadow-lg hover:shadow-[#25D366]/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <MessageSquare className="h-6 w-6" /> Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="reveal glass-card p-10 shadow-2xl border-white bg-bg-tertiary/50">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-tertiary uppercase px-1">Full Name</label>
                    <input type="text" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-tertiary uppercase px-1">Email</label>
                    <input type="email" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-tertiary uppercase px-1">Subject</label>
                  <input type="text" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-tertiary uppercase px-1">Message</label>
                  <textarea rows={4} placeholder="Your message here..."></textarea>
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl gradient-bg text-white font-black flex items-center justify-center gap-2 shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all duration-300">
                  Send Message <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section id="mobile-app" className="py-24 bg-bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Phone Mockup */}
            <div className="reveal flex justify-center lg:justify-start">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 via-accent/10 to-purple-500/20 rounded-[3rem] blur-2xl" />
                <div className="relative w-[280px] h-[560px] bg-text-primary rounded-[3rem] p-3 shadow-2xl border border-white/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-text-primary rounded-b-2xl z-20" />
                  <div className="w-full h-full rounded-[2.25rem] bg-gradient-to-br from-emerald-500 via-accent to-accent-dark flex flex-col items-center justify-center p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                      <div className="absolute top-8 left-6 w-20 h-20 border-2 border-white rounded-2xl rotate-12" />
                      <div className="absolute bottom-12 right-4 w-16 h-16 border-2 border-white rounded-full" />
                      <div className="absolute top-1/3 right-8 w-12 h-12 border-2 border-white rounded-xl -rotate-6" />
                    </div>
                    <div className="relative z-10 text-center space-y-4">
                      <div className="h-20 w-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
                        <GraduationCap className="h-10 w-10 text-white" />
                      </div>
                      <h4 className="text-white text-xl font-black">Skolic</h4>
                      <p className="text-white/80 text-xs font-medium">School Management App</p>
                      <div className="pt-4 space-y-2">
                        {['Attendance', 'Results', 'ID Cards', 'Fees'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-white/90 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -right-6 top-20 glass-card p-3 shadow-xl bg-white/95 animate-float hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Download className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-tertiary uppercase">Downloads</p>
                      <p className="text-sm font-black text-text-primary">1K+</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -left-6 bottom-32 glass-card p-3 shadow-xl bg-white/95 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-amber-500">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-current" />)}
                    </div>
                    <p className="text-xs font-black text-text-primary">4.8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="reveal space-y-8" style={{ animationDelay: '200ms' }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest">
                <Smartphone className="h-4 w-4" />
                Mobile App Available
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-tight">
                Take Your School <br />
                <span className="text-gradient">On the Go</span>
              </h3>
              <p className="text-text-secondary font-medium leading-relaxed text-lg max-w-xl">
                Download the School Management System Android App for quick access to attendance, assignments, results, ID cards, fee management, and school updates — anytime, anywhere.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, text: 'Real-time Attendance' },
                  { icon: <ClipboardList className="h-5 w-5 text-blue-500" />, text: 'Instant Results' },
                  { icon: <CreditCard className="h-5 w-5 text-purple-500" />, text: 'Fee Management' },
                  { icon: <QrCode className="h-5 w-5 text-amber-500" />, text: 'Digital ID Cards' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
                    {item.icon}
                    <span className="text-sm font-bold text-text-primary">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="https://skolic-app.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download Android App APK from Skolic"
                  className="download-app-btn px-8 py-4 rounded-2xl bg-emerald-500 text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 text-lg"
                >
                  <Download className="h-6 w-6" /> Download Android App
                </a>
              </div>
              <p className="text-xs text-text-tertiary font-medium">✓ Free Download &nbsp;·&nbsp; ✓ No Sign-up Required &nbsp;·&nbsp; ✓ Works Offline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/images/Skolic logo.png" alt="Skolic" className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-text-tertiary text-sm leading-relaxed">
                The ultimate school management software designed to simplify administration and enhance learning outcomes.
              </p>
              <a
                href="https://skolic-app.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download Android App"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Download className="h-4 w-4" /> Download Android App
              </a>
            </div>
            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6">Quick Links</h5>
              <ul className="space-y-4">
                <li><a href="#" className="text-text-tertiary hover:text-white transition-colors text-sm">Home</a></li>
                <li><a href="#features" className="text-text-tertiary hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#about" className="text-text-tertiary hover:text-white transition-colors text-sm">About Us</a></li>
                <li><a href="#mobile-app" className="text-text-tertiary hover:text-white transition-colors text-sm">Mobile App</a></li>
                <li><a href="#contact" className="text-text-tertiary hover:text-white transition-colors text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6">Top Features</h5>
              <ul className="space-y-4">
                <li><a href="#" className="text-text-tertiary hover:text-white transition-colors text-sm">Attendance</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white transition-colors text-sm">Result Portals</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white transition-colors text-sm">QR Scanner</a></li>
                <li><a href="#mobile-app" className="text-text-tertiary hover:text-white transition-colors text-sm">Mobile App</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6">Contact</h5>
              <div className="space-y-4">
                <a href="mailto:skolic@gmail.com" className="flex items-center gap-3 text-text-tertiary hover:text-white transition-colors text-sm">
                  <Mail className="h-4 w-4" /> skolic@gmail.com
                </a>
                <a href="tel:+923178923535" className="flex items-center gap-3 text-text-tertiary hover:text-white transition-colors text-sm">
                  <Phone className="h-4 w-4" /> +92 317 8923535
                </a>
                <a href="https://wa.me/923178923535" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-text-tertiary hover:text-white transition-colors text-sm">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-text-tertiary font-bold">
              © {new Date().getFullYear()} Skolic Platform. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-xs text-text-tertiary hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-text-tertiary hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/923178923535" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 animate-float sm:hidden"
      >
        <MessageSquare className="h-7 w-7" />
      </a>
    </div>
  );
}

// Helper Component
function Button({ children, href }: { children: React.ReactNode, href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-bg text-white font-bold shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all duration-300">
      {children} <ChevronRight className="h-5 w-5" />
    </Link>
  );
}
