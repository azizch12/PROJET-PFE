import { Link } from 'react-router-dom';
import { useState } from 'react';

// ─── Reusable logo ───
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-shadow">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <span className="text-xl font-bold text-gray-800 tracking-tight">LinguaPro</span>
    </Link>
  );
}

// ─── Feature card ───
function FeatureCard({ icon, title, desc, accent = 'bg-blue-50' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center mb-4 text-2xl`}>{icon}</div>
      <h3 className="text-[15px] font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Stat pill ───
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-gray-50 antialiased">

      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100/80">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">How it Works</a>
            <a href="#about" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">About</a>
            <a href="#contact" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30">
              Sign up 
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileMenu
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </nav>

        {/* Mobile nav */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-600 font-medium py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-600 font-medium py-2">How it Works</a>
            <a href="#about" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-600 font-medium py-2">About</a>
            <a href="#contact" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-600 font-medium py-2">Contact</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Log in</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Sign up</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
       
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Master any language with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">personalized learning</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg mt-5 max-w-xl mx-auto leading-relaxed">
          Learn at your own pace with structured courses, expert instructors, and intelligent placement testing to match your level.
        </p>
        <div className="flex items-center justify-center gap-4 mt-9">
          <Link to="/register" className="px-7 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5">
            Get started — it's free
          </Link>
          <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
            </svg>
            See how it works
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-16 flex items-center justify-center gap-12 md:gap-20">
          <Stat value="10+" label="Languages" />
          <div className="w-px h-10 bg-gray-200" />
          <Stat value="500+" label="Courses" />
          <div className="w-px h-10 bg-gray-200" />
          <Stat value="5K+" label="Learners" />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Everything you need to succeed</h2>
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">Our platform combines the best tools for effective language learning.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon="🎯" accent="bg-violet-50"
            title="Placement Test"
            desc="Take a 30-question adaptive test covering vocabulary, grammar, reading, writing, and listening to find your perfect starting level."
          />
          <FeatureCard
            icon="📚" accent="bg-blue-50"
            title="Structured Courses"
            desc="Access PDF lessons and video content organized by level — Beginner, Intermediate, and Advanced — tailored for your pace."
          />
          <FeatureCard
            icon="👨‍🏫" accent="bg-emerald-50"
            title="Expert Instructors"
            desc="Learn from qualified language instructors who create and manage course content for each language."
          />
          <FeatureCard
            icon="📊" accent="bg-amber-50"
            title="Progress Tracking"
            desc="Monitor your improvement across all skill categories with detailed score breakdowns and visual analytics."
          />
          <FeatureCard
            icon="🌍" accent="bg-cyan-50"
            title="Multiple Languages"
            desc="Choose from a growing library of languages. Switch between them anytime and track progress independently."
          />
          <FeatureCard
            icon="⚡" accent="bg-rose-50"
            title="Instant Feedback"
            desc="Get immediate results after tests with detailed corrections showing what you got right and where to improve."
          />
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Start learning in 3 steps</h2>
            <p className="text-sm text-gray-500 mt-3">It only takes a few minutes to begin your journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connecting lines (desktop) */}
            <div className="hidden md:block absolute top-16 left-[calc(33.33%+0.5rem)] w-[calc(33.33%-3rem)] h-px bg-gradient-to-r from-blue-200 to-blue-100" />
            <div className="hidden md:block absolute top-16 right-[calc(33.33%+0.5rem)] w-[calc(33.33%-3rem)] h-px bg-gradient-to-r from-blue-100 to-blue-200" />

            {[
              { step: '01', title: 'Create your account', desc: 'Sign up for free with email or Google — no credit card needed.', icon: '👤' },
              { step: '02', title: 'Take the placement test', desc: 'Complete a quick test to determine your proficiency level in any language.', icon: '📝' },
              { step: '03', title: 'Start learning', desc: 'Access courses matched to your level and track your progress as you improve.', icon: '🚀' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-sm shadow-blue-600/20">
                  STEP {item.step}
                </span>
                <span className="text-4xl block mt-3 mb-4">{item.icon}</span>
                <h3 className="text-[15px] font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 tracking-wide">ABOUT LINGUAPRO</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4">Built for learners, designed by educators</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              LinguaPro is a modern language learning platform that combines structured course content with intelligent assessment. 
              Our placement test uses weighted scoring across five skill categories to accurately determine your proficiency level.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Whether you're a complete beginner or looking to advance your skills, our platform adapts to your level and provides 
              the right content at the right time. Each language is managed by a dedicated instructor who curates lessons, 
              exercises, and test questions for the best learning experience.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { val: '5', label: 'Skill areas tested' },
                { val: '3', label: 'Proficiency levels' },
                { val: '20min', label: 'Placement test' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold text-gray-800">{s.val}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 via-violet-50 to-indigo-50 rounded-2xl p-10 border border-blue-100/50">
            <div className="space-y-5">
              {[
                { icon: '📖', text: 'Comprehensive courses with PDF & video content' },
                { icon: '🎧', text: 'Listening exercises with real audio material' },
                { icon: '✍️', text: 'Writing practice with intelligent fuzzy matching' },
                { icon: '📐', text: 'Grammar & vocabulary with instant feedback' },
                { icon: '📊', text: 'Detailed analytics tracking your improvement' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/80">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section id="contact" className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 tracking-wide">CONTACT US</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">Have questions?</h2>
          <p className="text-sm text-gray-500 mb-10">We'd love to hear from you. Reach out and we'll get back to you soon.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: '✉️', title: 'Email', value: 'support@linguapro.com', href: 'mailto:support@linguapro.com' },
              { icon: '💬', title: 'Live Chat', value: 'Available 9am – 6pm', href: '#' },
              { icon: '📍', title: 'Location', value: 'Tunis, Tunisia', href: '#' },
            ].map((c) => (
              <a key={c.title} href={c.href} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block">
                <span className="text-2xl block mb-3">{c.icon}</span>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{c.title}</h3>
                <p className="text-xs text-gray-400">{c.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative bg-gray-900 rounded-3xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_60%)]" />
          </div>

          <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Left: text */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[11px] font-semibold text-blue-300 mb-5 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
                100% free to start
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                Ready to discover<br className="hidden md:block" /> your language level?
              </h2>
              <p className="text-gray-400 text-[15px] leading-relaxed max-w-lg mb-8">
                Join thousands of learners already using LinguaPro. Take your free placement test and start learning with courses matched to your level.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                <Link to="/register" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5">
                  Get started for free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-gray-300 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                  I already have an account
                </Link>
              </div>
            </div>

            {/* Right: visual stats */}
           
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-6">
          {/* Main footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-14 border-b border-white/10">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">LinguaPro</span>
              </Link>
              <p className="text-[13px] leading-relaxed text-gray-500 mb-5">
                A modern language learning platform with intelligent placement testing and structured courses.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                {[
                  { label: 'Twitter', path: 'M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.37 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.29 3.9A12.13 12.13 0 013.1 4.9a4.28 4.28 0 001.32 5.71 4.24 4.24 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.19 4.27 4.27 0 01-1.93.07 4.28 4.28 0 004 2.97A8.58 8.58 0 012 19.54a12.1 12.1 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0024 5.5a8.46 8.46 0 01-2.54.7z' },
                  { label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                ].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <svg className="w-3.5 h-3.5 fill-current text-gray-400 hover:text-white transition-colors" viewBox="0 0 24 24">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How it Works', href: '#how-it-works' },
                  { label: 'Placement Test', href: '#features' },
                  { label: 'Courses', href: '#features' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[13px] hover:text-white transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'About Us', href: '#about' },
                  { label: 'Contact', href: '#contact' },
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[13px] hover:text-white transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Get Started</h4>
              <ul className="space-y-2.5">
                <li><Link to="/register" className="text-[13px] hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/login" className="text-[13px] hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="mailto:support@linguapro.com" className="text-[13px] hover:text-white transition-colors">Support</a></li>
              </ul>
              <div className="mt-5 p-3.5 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[11px] text-gray-500 font-medium mb-1">Need help?</p>
                <a href="mailto:support@linguapro.com" className="text-[13px] text-blue-400 font-medium hover:text-blue-300 transition-colors">
                  support@linguapro.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} LinguaPro. All rights reserved.</p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}
