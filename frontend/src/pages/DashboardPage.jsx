import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInstructorLanguages, getChapters, getTestQuestions, getLearnerDashboard } from '../api/auth';

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
        {/* Learner gets a fully custom dashboard */}
        {user?.role === 'learner' && <LearnerDashboard user={user} />}

        {/* Instructor gets a fully custom dashboard */}
        {user?.role === 'instructor' && <InstructorDashboard user={user} />}

        {user?.role === 'admin' && (
          <>
            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{greeting()}, {user?.name?.split(' ')[0]}</h1>
              <p className="text-sm mt-1 text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </>
        )}

        {/* Stats Cards */}
        {user?.role === 'admin' && <AdminStats />}

        {/* Quick Actions */}
        {user?.role === 'admin' && (
        <div>
          <h3 className="text-base font-semibold mb-4 text-white">Quick Actions</h3>
          <AdminActions />
        </div>
        )}

        {/* Recent Activity */}
        {user?.role === 'admin' && (
        <div>
          <h3 className="text-base font-semibold mb-4 text-white">Recent Activity</h3>
          <div className="rounded-2xl border p-8 bg-[#111827] border-white/5">
            <div className="text-center py-6 text-slate-500">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white/5">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-slate-400">No recent activity</p>
              <p className="text-xs mt-1.5 max-w-xs mx-auto text-slate-500">Your activity will appear here as you start using the platform.</p>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}

// ─── Learner Components ────────────────────────────────

function LearnerDashboard({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = () => {
      setLoading(true);
      getLearnerDashboard()
        .then(({ data }) => {
          if (!mounted) return;
          setAnalytics(data);
        })
        .catch(() => {
          if (!mounted) return;
          setAnalytics(null);
        })
        .finally(() => {
          if (!mounted) return;
          setLoading(false);
        });
    };

    load();
    const onLanguageChanged = () => load();
    window.addEventListener('languageChanged', onLanguageChanged);

    return () => {
      mounted = false;
      window.removeEventListener('languageChanged', onLanguageChanged);
    };
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = analytics?.stats || {
    languages_enrolled: 0,
    courses_in_progress: 0,
    completed_chapters: 0,
    overall_progress: 0,
    day_streak: 0,
    xp_points: 0,
  };

  const weeklyActivity = analytics?.weekly_activity || [];
  const maxActivity = Math.max(...weeklyActivity.map((item) => item.count), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-7 sm:p-8 text-white shadow-xl shadow-violet-500/15">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-violet-200 text-sm font-medium mb-1">{greeting()}</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {user?.name?.split(' ')[0]}, ready to learn?
              </h1>
              <p className="text-violet-100/80 text-sm max-w-md leading-relaxed">
                Continue your learning adventure with your real progress and activity.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Link to="/learner/languages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 font-semibold text-sm rounded-xl hover:bg-violet-50 transition-all duration-200 shadow-lg shadow-violet-900/20">
                  Start Learning
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link to="/learner/test" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition-all duration-200 ring-1 ring-white/20">
                  Take Test
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 min-w-[90px] hover:bg-white/15 transition-colors duration-200">
                <svg className="w-5 h-5 mx-auto mb-1 text-orange-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47A7.5 7.5 0 0112 23z" /></svg>
                <div className="text-2xl font-bold">{stats.day_streak}</div>
                <div className="text-[11px] text-violet-200 mt-0.5 font-medium">Day Streak</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 min-w-[90px] hover:bg-white/15 transition-colors duration-200">
                <svg className="w-5 h-5 mx-auto mb-1 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <div className="text-2xl font-bold">{stats.xp_points}</div>
                <div className="text-[11px] text-violet-200 mt-0.5 font-medium">XP Points</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Languages', value: `${stats.languages_enrolled}`, sub: 'enrolled', icon: (<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>), gradient: 'from-violet-500 to-purple-500', light: 'from-violet-50 to-purple-50', text: 'text-violet-700' },
          { label: 'Courses', value: `${stats.courses_in_progress}`, sub: 'in progress', icon: (<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>), gradient: 'from-emerald-500 to-teal-500', light: 'from-emerald-50 to-teal-50', text: 'text-emerald-700' },
          { label: 'Chapters', value: `${stats.completed_chapters}`, sub: 'completed', icon: (<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), gradient: 'from-amber-500 to-orange-500', light: 'from-amber-50 to-orange-50', text: 'text-amber-700' },
          { label: 'Progress', value: `${stats.overall_progress}%`, sub: 'overall', icon: (<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>), gradient: 'from-rose-500 to-pink-500', light: 'from-rose-50 to-pink-50', text: 'text-rose-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.light} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.text} tracking-tight`}>{stat.value}</p>
            <p className="text-[13px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning Card */}
      {analytics?.continue_learning && (() => {
        const cl = analytics.continue_learning;
        const progressPct = cl.total > 0 ? Math.round((cl.completed / cl.total) * 100) : 0;
        return (
          <Link to="/learner/courses" className="group block bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="shrink-0 w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-0.5">Continue Learning</p>
                <h3 className="text-lg font-bold truncate">{cl.chapter_title}</h3>
                <p className="text-violet-200/80 text-sm mt-0.5">
                  {cl.language_name} · {cl.level_name} · Chapter {cl.chapter_order}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white/90 shrink-0">{cl.completed}/{cl.total}</span>
                </div>
              </div>
              <div className="shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-800">Weekly Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Learning actions this week</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-violet-500"></div>
              <span className="text-xs text-violet-600 font-medium">This week</span>
            </div>
          </div>
          <div className="flex items-end gap-2.5 h-36">
            {weeklyActivity.map((item) => {
              const isToday = item.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group/bar cursor-default">
                    {item.count > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {item.count} action{item.count > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="w-full bg-gray-50 rounded-xl overflow-hidden" style={{ height: '120px' }}>
                      <div
                        className={`w-full absolute bottom-0 rounded-xl transition-all duration-500 ${
                          item.count > 0
                            ? 'bg-gradient-to-t from-violet-600 to-purple-400 group-hover/bar:from-violet-500 group-hover/bar:to-purple-300'
                            : 'bg-gray-100'
                        }`}
                        style={{ height: `${(item.count / maxActivity) * 100}%`, minHeight: item.count > 0 ? '8px' : '4px' }}
                      />
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${isToday ? 'text-violet-600' : 'text-gray-400'}`}>{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl border border-violet-100/50 p-6 flex flex-col shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/20 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1.5">Placement Test</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
              Discover your level with a quick 5-category assessment: Vocabulary, Grammar, Reading, Writing, and Listening.
            </p>
            <Link to="/learner/test" className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-md shadow-violet-500/20 w-fit">
              Take the Test
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-800 mb-4">Explore</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Languages', desc: 'Choose a language to learn', icon: (<svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>), to: '/learner/languages', gradient: 'from-violet-500 to-purple-600', light: 'from-violet-50 to-purple-50' },
            { label: 'My Courses', desc: 'Continue learning chapters', icon: (<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>), to: '/learner/courses', gradient: 'from-emerald-500 to-teal-500', light: 'from-emerald-50 to-teal-50' },
            { label: 'Exercises', desc: 'Practice your skills', icon: (<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>), to: '/learner/exercises', gradient: 'from-amber-500 to-orange-500', light: 'from-amber-50 to-orange-50' },
            { label: 'My Progress', desc: 'Track your growth', icon: (<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>), to: '/learner/progress', gradient: 'from-rose-500 to-pink-500', light: 'from-rose-50 to-pink-50' },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 block">
              <div className={`h-1.5 bg-gradient-to-r ${item.gradient}`} />
              <div className="p-5">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.light} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h4 className="font-bold text-gray-800 text-[14px] mb-1 group-hover:text-violet-700 transition-colors duration-200">{item.label}</h4>
                <p className="text-[12px] text-gray-400 leading-relaxed">{item.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Instructor Components ─────────────────────────────

function InstructorDashboard({ user }) {
  const [languages, setLanguages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getInstructorLanguages().then(r => r.data).catch(() => []),
      getChapters({}).then(r => r.data).catch(() => []),
      getTestQuestions({}).then(r => r.data).catch(() => []),
    ]).then(([langs, chaps, qs]) => {
      setLanguages(langs);
      setChapters(chaps);
      setQuestions(qs);
      setLoading(false);
    });
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const publishedCount = chapters.filter(c => c.is_published).length;
  const draftCount = chapters.filter(c => !c.is_published).length;
  const categories = ['vocabulary', 'grammar', 'reading', 'listening', 'writing'];
  const catCounts = categories.map(cat => ({ cat, count: questions.filter(q => q.category === cat).length }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl animate-pulse bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
          <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl p-7 sm:p-8 text-white shadow-xl shadow-indigo-500/15">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-indigo-200 text-sm font-medium mb-1">{greeting()}</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {user?.name?.split(' ')[0]}, let's create!
              </h1>
              <p className="text-indigo-100/80 text-sm max-w-md leading-relaxed">
                Manage your courses, build chapters, and craft placement tests from your instructor hub.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Link to="/instructor/chapters" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg shadow-indigo-900/20">
                  New Chapter
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </Link>
                <Link to="/instructor/test-questions" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition-all duration-200 ring-1 ring-white/20">
                  Add Questions
                </Link>
              </div>
            </div>

            {/* Language badges on desktop */}
            <div className="hidden lg:flex flex-col items-end gap-2">
              {languages.slice(0, 3).map(lang => (
                <span key={lang.id} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/15 transition-colors duration-200">
                  {lang.image_url && <img src={lang.image_url} alt="" className="w-4 h-4 rounded-sm object-cover" />}
                  {lang.name}
                </span>
              ))}
              {languages.length > 3 && (
                <span className="text-[11px] text-indigo-200 font-medium">+{languages.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Languages',
            value: languages.length,
            sub: 'assigned',
            gradient: 'from-blue-500 to-indigo-500',
            light: 'from-blue-50 to-indigo-50',
            text: 'text-blue-700',
            icon: (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            ),
          },
          {
            label: 'Chapters',
            value: chapters.length,
            sub: `${publishedCount} published`,
            gradient: 'from-emerald-500 to-teal-500',
            light: 'from-emerald-50 to-teal-50',
            text: 'text-emerald-700',
            icon: (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ),
          },
          {
            label: 'Test Questions',
            value: questions.length,
            sub: `${categories.length} categories`,
            gradient: 'from-amber-500 to-orange-500',
            light: 'from-amber-50 to-orange-50',
            text: 'text-amber-700',
            icon: (
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            ),
          },
          {
            label: 'Drafts',
            value: draftCount,
            sub: 'unpublished',
            gradient: 'from-rose-500 to-pink-500',
            light: 'from-rose-50 to-pink-50',
            text: 'text-rose-700',
            icon: (
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.light} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.text} tracking-tight`}>{stat.value}</p>
            <p className="text-[13px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Content Overview + Quick Actions Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Question Distribution — bar chart style */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-800">Question Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5">{questions.length} total across {categories.length} categories</p>
            </div>
            <Link to="/instructor/test-questions" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
          <div className="space-y-3.5">
            {[
              { cat: 'vocabulary', label: 'Vocabulary', gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', iconColor: 'text-blue-600',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
              { cat: 'grammar', label: 'Grammar', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', iconColor: 'text-violet-600',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg> },
              { cat: 'reading', label: 'Reading', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
              { cat: 'listening', label: 'Listening', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', iconColor: 'text-amber-600',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg> },
              { cat: 'writing', label: 'Writing', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', iconColor: 'text-rose-600',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg> },
            ].map(({ cat, label, gradient, bg, icon, iconColor }) => {
              const count = catCounts.find(c => c.cat === cat)?.count || 0;
              const max = Math.max(...catCounts.map(c => c.count), 1);
              const pct = (count / max) * 100;
              return (
                <div key={cat} className="group flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 ${iconColor} transition-transform duration-200 group-hover:scale-110`}>
                    {icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-20">{label}</span>
                  <div className="flex-1 h-8 bg-gray-50 rounded-xl overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} rounded-xl transition-all duration-700 ease-out`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions — polished card stack */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-800">Quick Actions</h3>
          {[
            {
              label: 'Add Chapter',
              desc: 'Create new course content',
              to: '/instructor/chapters',
              gradient: 'from-blue-500 to-indigo-600',
              light: 'from-blue-50 to-indigo-50',
              iconColor: 'text-blue-600',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              ),
            },
            {
              label: 'Add Test Question',
              desc: 'Build placement tests',
              to: '/instructor/test-questions',
              gradient: 'from-violet-500 to-purple-600',
              light: 'from-violet-50 to-purple-50',
              iconColor: 'text-violet-600',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              ),
            },
            {
              label: 'My Profile',
              desc: 'Update your info',
              to: '/profile',
              gradient: 'from-emerald-500 to-teal-600',
              light: 'from-emerald-50 to-teal-50',
              iconColor: 'text-emerald-600',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              ),
            },
          ].map((action) => (
            <Link key={action.label} to={action.to}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-100 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.light} ${action.iconColor} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors duration-200">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors duration-200 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Chapters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800">Recent Chapters</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your latest content</p>
          </div>
          <Link to="/instructor/chapters" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
        {chapters.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-700">No chapters yet</p>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto">Start building your course by creating your first chapter.</p>
            <Link to="/instructor/chapters" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-indigo-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Create Chapter
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {chapters.slice(0, 5).map((ch, idx) => (
              <div key={ch.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-transparent transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-sm font-bold text-indigo-500 shrink-0 ring-1 ring-indigo-100/50 group-hover:scale-105 transition-transform duration-200">
                  {ch.order || idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors duration-200">{ch.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 font-medium">{ch.language?.name}</span>
                    {ch.level && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-xs text-gray-400 font-medium">{ch.level.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                  ch.is_published
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                    : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ch.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {ch.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// ─── Admin Components ──────────────────────────────────

function AdminStats() {
  const stats = [
    { label: 'Total Users', value: '0', icon: UsersIcon, color: 'blue' },
    { label: 'Total Courses', value: '0', icon: BookIcon, color: 'green' },
    { label: 'Languages', value: '0', icon: GlobeIcon, color: 'orange' },
    { label: 'Active Instructors', value: '0', icon: UserIcon, color: 'purple' },
  ];
  return <StatsGrid stats={stats} dark />;
}

function AdminActions() {
  const actions = [
    { label: 'Manage Users', desc: 'View and manage all users', icon: UsersIcon, color: 'blue', to: '/admin/users' },
    { label: 'Manage Languages', desc: 'Add or edit languages', icon: GlobeIcon, color: 'green', to: '/admin/languages' },
    { label: 'Manage Courses', desc: 'Review all courses', icon: BookIcon, color: 'orange' },
  ];
  return <ActionsGrid actions={actions} dark />;
}

// ─── Reusable Layout Components ────────────────────────

function StatsGrid({ stats, dark }) {
  const colorMap = dark ? {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
  } : {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-2xl border p-5 hover:-translate-y-0.5 transition-all duration-300 group ${
          dark ? 'bg-[#111827] border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[stat.color]} transition-transform duration-300 group-hover:scale-105`}>
              <stat.icon />
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-800'}`}>{stat.value}</p>
          <p className={`text-[13px] mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function ActionsGrid({ actions, dark }) {
  const colorMap = dark ? {
    blue: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15',
    green: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
    orange: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/15',
    purple: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/15',
  } : {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => {
        const cardClass = `rounded-2xl border p-6 text-left hover:-translate-y-0.5 transition-all duration-300 cursor-pointer block group ${
          dark ? 'bg-[#111827] border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:shadow-md'
        }`;
        const content = (
          <>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105 ${colorMap[action.color]}`}>
              <action.icon />
            </div>
            <h4 className={`font-semibold mb-1 text-[15px] ${dark ? 'text-white' : 'text-gray-800'}`}>{action.label}</h4>
            <p className={`text-[13px] leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{action.desc}</p>
          </>
        );
        return action.to ? (
          <Link key={action.label} to={action.to} className={cardClass}>{content}</Link>
        ) : (
          <button key={action.label} className={cardClass}>{content}</button>
        );
      })}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────

function BookIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}



function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}



function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}



function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}


