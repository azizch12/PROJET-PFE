import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveLanguages } from '../../api/auth';

const CARD_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-purple-500',
  'from-sky-500 to-indigo-500',
];

export default function LearnerLanguagesPage() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => {
    const saved = localStorage.getItem('selectedLanguageId');
    return saved ? Number(saved) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    getActiveLanguages()
      .then(({ data }) => setLanguages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (lang) => {
    setSelectedId(lang.id);
    localStorage.setItem('selectedLanguageId', lang.id);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { languageId: lang.id } }));
    setTimeout(() => navigate('/dashboard'), 350);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-7 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-28 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto" />
                <div className="h-4 w-20 bg-gray-100 rounded mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 sm:p-8 shadow-lg shadow-violet-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              🌍 Choose Your Language
            </h1>
            <p className="text-sm text-white/70 mt-2 max-w-md">
              Pick a language to start or continue your learning adventure. You can switch anytime!
            </p>
            {selectedId && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-white/60">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Currently learning: <span className="text-white/90">{languages.find(l => l.id === selectedId)?.name || 'Unknown'}</span>
              </div>
            )}
          </div>
          {selectedId && (
            <button onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-all duration-200 cursor-pointer ring-1 ring-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Languages count */}
      {languages.length > 0 && (
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800">Available Languages</h2>
          <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-full">
            {languages.length}
          </span>
        </div>
      )}

      {/* Language Grid */}
      {languages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {languages.map((lang, idx) => {
            const isActive = selectedId === lang.id;
            const gradient = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <button key={lang.id} onClick={() => handleSelect(lang)}
                className={`relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group text-center ${
                  isActive
                    ? 'ring-2 ring-violet-500 ring-offset-2 shadow-lg shadow-violet-100'
                    : 'border border-gray-100 hover:border-gray-200'
                }`}>
                {/* Top gradient strip */}
                <div className={`h-3 bg-gradient-to-r ${gradient} ${isActive ? 'h-4' : ''} transition-all duration-300`} />

                {/* Selected badge */}
                {isActive && (
                  <div className="absolute top-5 right-3 z-20">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="p-5 pb-6">
                  {/* Flag */}
                  <div className="flex justify-center mb-4">
                    {lang.image_url ? (
                      <div className={`w-20 h-[58px] rounded-xl overflow-hidden shadow-md ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                        <img src={lang.image_url} alt={lang.name}
                          className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-20 h-[58px] rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                        <span className="text-white font-bold text-xl tracking-wider">
                          {lang.code?.toUpperCase()?.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Language name */}
                  <p className={`text-sm font-bold mb-1 ${isActive ? 'text-violet-700' : 'text-gray-800'} group-hover:text-violet-600 transition-colors duration-200`}>
                    {lang.name}
                  </p>

                  {/* Status label */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Learning
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium group-hover:text-violet-400 transition-colors">
                      Click to start
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <span className="text-4xl">🌐</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No languages available yet</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              New languages will appear here once they're published. Check back soon!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
