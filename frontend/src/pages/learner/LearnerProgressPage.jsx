import { useEffect, useState } from 'react';
import { getLearnerProgress } from '../../api/auth';

const periods = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const heatmapColors = ['bg-gray-100', 'bg-violet-200', 'bg-violet-400', 'bg-violet-600'];
const skillStyles = {
  Grammar: { gradient: 'from-violet-500 to-purple-500', icon: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>) },
  Vocabulary: { gradient: 'from-emerald-500 to-teal-500', icon: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>) },
  Reading: { gradient: 'from-blue-500 to-indigo-500', icon: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) },
  Listening: { gradient: 'from-amber-500 to-orange-500', icon: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>) },
  Writing: { gradient: 'from-rose-500 to-pink-500', icon: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>) },
};

export default function LearnerProgressPage() {
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = (currentPeriod = period) => {
    const selectedLanguageId = localStorage.getItem('selectedLanguageId');
    setLoading(true);
    getLearnerProgress({
      period: currentPeriod,
      language_id: selectedLanguageId || undefined,
    })
      .then(({ data: payload }) => setData(payload))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    const onLanguageChanged = () => loadData(period);
    window.addEventListener('languageChanged', onLanguageChanged);
    return () => window.removeEventListener('languageChanged', onLanguageChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const overview = data?.overview || {
    total_xp: 0,
    lessons_done: 0,
    tests_done: 0,
    day_streak: 0,
    active_days: 0,
  };

  const skills = data?.skills || [];
  const languages = data?.languages || [];
  const heatmap = data?.heatmap || [];
  const achievements = data?.achievements || { unlocked: 0, total: 0, items: [] };

  const skillRows = skills.map((s) => ({
    ...s,
    ...(skillStyles[s.skill] || { gradient: 'from-gray-500 to-gray-600', icon: '--' }),
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time learning analytics from your activity</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                period === p.key ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total XP', value: `${overview.total_xp}`, icon: (<svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>), gradient: 'from-amber-500 to-orange-500', light: 'from-amber-50 to-orange-50', text: 'text-amber-700' },
          { label: 'Lessons Done', value: `${overview.lessons_done}`, icon: (<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>), gradient: 'from-violet-500 to-purple-500', light: 'from-violet-50 to-purple-50', text: 'text-violet-700' },
          { label: 'Tests Done', value: `${overview.tests_done}`, icon: (<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>), gradient: 'from-emerald-500 to-teal-500', light: 'from-emerald-50 to-teal-50', text: 'text-emerald-700' },
          { label: 'Day Streak', value: `${overview.day_streak}`, icon: (<svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47A7.5 7.5 0 0112 23z" /></svg>), gradient: 'from-rose-500 to-pink-500', light: 'from-rose-50 to-pink-50', text: 'text-rose-700' },
          { label: 'Active Days', value: `${overview.active_days}`, icon: (<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>), gradient: 'from-blue-500 to-indigo-500', light: 'from-blue-50 to-indigo-50', text: 'text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
            <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="p-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.light} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
              <p className="text-[12px] text-gray-400 mt-0.5 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-800">Activity Heatmap</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 12 weeks of chapter and test activity</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-1">Low</span>
              {heatmapColors.map((c, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-[3px] ${c}`} />
              ))}
              <span className="text-[10px] text-gray-400 ml-1">High</span>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                className={`aspect-square rounded-[4px] ${heatmapColors[cell.level] || heatmapColors[0]} transition-all duration-200 hover:ring-2 hover:ring-violet-300 hover:scale-110 cursor-default`}
                title={`${cell.date}: ${cell.count} action${cell.count === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-5">Skills</h3>
          <div className="space-y-4">
            {skillRows.map((s) => (
              <div key={s.skill}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-gray-600">{s.icon}</span>
                    <span className="text-sm text-gray-700 font-semibold">{s.skill}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">{s.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${s.gradient} rounded-full transition-all duration-700`} style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-50 text-center">
            <p className="text-[12px] text-gray-400 font-medium">Skill percentages are based on your placement test scores.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5">Language Progress</h3>
          {languages.length === 0 ? (
            <div className="text-center py-8">
              <h4 className="font-bold text-gray-700 text-base mb-1">No languages enrolled yet</h4>
              <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                Choose a language and take the placement test to start tracking progress.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {languages.map((lang) => (
                <div key={lang.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{lang.name}</p>
                      <p className="text-xs text-gray-400">{lang.level_name}</p>
                    </div>
                    <span className="text-sm font-bold text-violet-600">{lang.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600" style={{ width: `${lang.percentage}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{lang.completed} of {lang.total} chapters completed</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-bold text-gray-800">Achievements</h3>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">
            {achievements.unlocked} / {achievements.total}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(achievements.items || []).map((ach) => (
            <div key={ach.key} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group ${
              ach.unlocked ? 'border-amber-200 shadow-sm' : 'border-gray-100'
            }`}>
              <div className={`h-1 ${ach.unlocked ? 'bg-gradient-to-r from-amber-400 to-yellow-400' : 'bg-gray-100'}`} />
              <div className="p-4 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2.5 text-2xl transition-transform duration-300 group-hover:scale-110 ${
                  ach.unlocked ? 'bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm' : 'bg-gray-50 grayscale opacity-60'
                }`}>
                  {{ first_step: '👣', test_starter: '📝', streak_master: '🔥', chapter_master: '📚', multilingual: '🌍', dedicated: '⭐' }[ach.key] || '🏆'}
                </div>
                <h4 className="text-[13px] font-bold text-gray-700 mb-0.5">{ach.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">{ach.desc}</p>
                {!ach.unlocked && (
                  <div className="mt-2.5 flex items-center justify-center gap-1 text-gray-300">
                    <span className="text-[10px] font-semibold">Locked</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
