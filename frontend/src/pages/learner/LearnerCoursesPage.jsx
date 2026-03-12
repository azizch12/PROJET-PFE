import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearnerChapters, completeChapter } from '../../api/auth';

// Helpers to detect embeddable video URLs and extract embed src
function getVideoEmbedUrl(url) {
  if (!url) return null;
  try {
    // YouTube
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
    // Vimeo
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    // Dailymotion
    m = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
    if (m) return `https://www.dailymotion.com/embed/video/${m[1]}`;
  } catch { /* ignore */ }
  return null;
}

const LEVEL_THEMES = {
  1: { bg: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200', icon: '🌱', label: 'Beginner', accent: 'emerald', bar: 'bg-emerald-500' },
  2: { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-200', icon: '📚', label: 'Intermediate', accent: 'amber', bar: 'bg-amber-500' },
  3: { bg: 'from-rose-500 to-pink-500', light: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-200', icon: '🎓', label: 'Advanced', accent: 'rose', bar: 'bg-rose-500' },
};

export default function LearnerCoursesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const navigate = useNavigate();

  const langId = localStorage.getItem('selectedLanguageId');

  const fetchData = useCallback(() => {
    if (!langId) { setData(null); setLoading(false); return; }
    setLoading(true);
    getLearnerChapters({ language_id: langId })
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [langId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => {
      setData(null);
      setLoading(true);
      getLearnerChapters({ language_id: localStorage.getItem('selectedLanguageId') })
        .then(({ data }) => setData(data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    };
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  const handleComplete = async (chapterId) => {
    setCompleting(chapterId);
    try {
      const { data: res } = await completeChapter(chapterId);
      fetchData();
    } catch {
      // silently fail
    } finally {
      setCompleting(null);
    }
  };

  const theme = data?.level ? (LEVEL_THEMES[data.level.order] || LEVEL_THEMES[1]) : LEVEL_THEMES[1];

  // Relative time helper
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  // Motivational message based on progress
  const getMotivation = (pct) => {
    if (pct === 0) return { text: "Let's get started! Your first chapter awaits.", emoji: '🚀' };
    if (pct < 30) return { text: "Great start! Keep the momentum going.", emoji: '💪' };
    if (pct < 60) return { text: "You're making great progress!", emoji: '🔥' };
    if (pct < 100) return { text: "Almost there! Just a few more to go.", emoji: '⭐' };
    return { text: "Amazing! You've mastered this level!", emoji: '🏆' };
  };

  // ─── No language selected ───
  if (!langId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and continue your learning journey</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-4xl">📖</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No language selected</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
              Select a language from the header dropdown to see available courses.
            </p>
            <button onClick={() => navigate('/learner/languages')} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20 cursor-pointer">
              Browse Languages
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-36 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Needs placement test ───
  if (data?.needs_test) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and continue your learning journey</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />
          <div className="text-center py-14 px-6">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-blue-100 rounded-3xl rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl flex items-center justify-center shadow-sm">
                <span className="text-5xl">🎯</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Take Your Placement Test First</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
              Before accessing courses, we need to determine your level.
              Complete a quick placement test and we'll personalize your learning path.
            </p>
            <button onClick={() => navigate('/learner/test')} className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all shadow-lg shadow-violet-500/25 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Start Placement Test
            </button>
            <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-medium text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ~20 minutes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-medium text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                30 questions
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-medium text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
                5 skill categories
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Has level — show chapters ───
  const { chapters = [], progress, level } = data || {};
  const pct = progress?.percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and continue your learning journey</p>
        </div>
        {chapters.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-violet-50 rounded-xl">
              <span className="text-sm">📚</span>
              <span className="text-xs font-bold text-violet-700">{chapters.length} chapters</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-1.5 bg-gradient-to-r ${theme.bg}`} />
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${theme.bg} rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0`}>
              {theme.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="text-lg font-bold text-gray-900 truncate">{level?.name}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full ${theme.badge} ring-1 ${theme.ring}`}>
                  {theme.label}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {progress?.completed || 0} of {progress?.total || 0} chapters completed
              </p>
            </div>
            {/* Circular progress — desktop */}
            <div className="hidden sm:flex items-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor"
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${pct * 1.759} 175.9`}
                    className={pct === 100 ? 'text-green-500' : level?.order === 1 ? 'text-emerald-500' : level?.order === 2 ? 'text-amber-500' : 'text-rose-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-extrabold ${pct === 100 ? 'text-green-600' : 'text-gray-700'}`}>{pct}%</span>
                </div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${pct === 100 ? 'bg-green-500' : theme.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400 font-medium">
              {pct === 100 ? '✅ All chapters completed!' : `${100 - pct}% remaining`}
            </span>
            <span className="sm:hidden text-xs font-bold text-gray-600">{pct}%</span>
          </div>
          {/* Motivational message */}
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gray-50 rounded-xl">
            <span className="text-base">{getMotivation(pct).emoji}</span>
            <span className="text-xs font-medium text-gray-600">{getMotivation(pct).text}</span>
          </div>
        </div>
      </div>

      {/* Level Completed — Take Test to Advance */}
      {data?.level_completed && data?.next_level && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl border border-white/10">
              🏆
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold mb-1">Level Completed!</h3>
              <p className="text-white/85 text-sm leading-relaxed">
                You've finished all chapters in <span className="font-bold">{level?.name}</span>. Take a placement test to advance to <span className="font-bold">{data.next_level.name}</span>.
              </p>
            </div>
            <button
              onClick={() => navigate('/learner/test?mode=levelup')}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-700 font-bold text-sm rounded-xl hover:bg-amber-50 transition-all shadow-lg cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              Take Level Test
            </button>
          </div>
        </div>
      )}

      {/* Chapters grid */}
      {chapters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No courses available yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Chapters for your level haven't been published yet. Check back soon!
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chapters.map((ch, idx) => {
              const isCompleted = ch.is_completed;
              const isLocked = idx > 0 && !chapters[idx - 1].is_completed;
              const isCompleting = completing === ch.id;
            return (
              <div key={ch.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 group
                  ${isLocked ? 'border-gray-100 opacity-60 grayscale-[30%]' : isCompleted ? 'border-green-200/60 hover:shadow-xl hover:-translate-y-1' : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'}`}>
                {/* Chapter cover */}
                <div className={`h-32 bg-gradient-to-br ${isCompleted ? 'from-green-400 to-emerald-500' : theme.bg} p-5 flex flex-col justify-between relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                  <div className="flex items-center justify-between relative z-10">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Chapter {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <span className="bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Done
                        </span>
                      )}
                      {ch.pdf_url && (
                        <span className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center" title="Has PDF">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                      {ch.video_url && (
                        <span className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center" title="Has Video">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2 relative z-10 group-hover:translate-x-0.5 transition-transform duration-300">
                    {ch.title}
                  </h3>
                </div>
                {/* Chapter body */}
                <div className="p-5 space-y-4">
                  {ch.description && (
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">{ch.description}</p>
                  )}
                  {/* Resource buttons */}
                  <div className="flex items-center gap-2">
                    {ch.pdf_url && (
                      <button onClick={() => setExpandedChapter(expandedChapter === ch.id ? null : ch.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ring-1 group/btn cursor-pointer ${
                          expandedChapter === ch.id ? 'bg-red-100 text-red-700 ring-red-200' : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 ring-red-100'
                        }`}>
                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        {expandedChapter === ch.id ? 'Hide PDF' : 'View PDF'}
                      </button>
                    )}
                    {ch.video_url && (
                      (() => {
                        const embedUrl = getVideoEmbedUrl(ch.video_url);
                        if (embedUrl) {
                          return (
                            <button onClick={() => setExpandedChapter(expandedChapter === `v-${ch.id}` ? null : `v-${ch.id}`)}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ring-1 group/btn cursor-pointer ${
                                expandedChapter === `v-${ch.id}` ? 'bg-blue-100 text-blue-700 ring-blue-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 ring-blue-100'
                              }`}>
                              <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                              {expandedChapter === `v-${ch.id}` ? 'Hide Video' : 'Watch Video'}
                            </button>
                          );
                        }
                        return (
                          <a href={ch.video_url} target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-xl text-xs font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 ring-1 ring-blue-100 group/btn">
                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            Watch Video
                            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                          </a>
                        );
                      })()
                    )}
                    {!ch.pdf_url && !ch.video_url && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Content coming soon
                      </div>
                    )}
                  </div>
                  {/* Inline content viewer */}
                  {expandedChapter === ch.id && ch.pdf_url && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <iframe src={ch.pdf_url} title={`PDF - ${ch.title}`} className="w-full h-[450px]" />
                    </div>
                  )}
                  {expandedChapter === `v-${ch.id}` && ch.video_url && getVideoEmbedUrl(ch.video_url) && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video">
                      <iframe src={getVideoEmbedUrl(ch.video_url)} title={`Video - ${ch.title}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                  {/* Complete / Completed / Locked */}
                  {isLocked ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl ring-1 ring-gray-200/60">
                      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      <span className="text-xs font-semibold text-gray-400">Complete previous chapter to unlock</span>
                    </div>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl ring-1 ring-green-200/60">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-green-700">Completed</span>
                        {ch.completed_at && (
                          <span className="text-[10px] text-green-500/70">{timeAgo(ch.completed_at)}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleComplete(ch.id)} disabled={isCompleting || isLocked}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-500/15 disabled:opacity-50 cursor-pointer">
                      {isCompleting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Completing...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Mark as Complete</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
