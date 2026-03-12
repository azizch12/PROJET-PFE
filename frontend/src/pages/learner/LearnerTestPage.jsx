import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getLearnerTest, submitLearnerTest, retakeLearnerTest } from '../../api/auth';

const CATEGORY_META = {
  vocabulary: { icon: '📝', label: 'Vocabulary', color: 'text-purple-600 bg-purple-50' },
  grammar:    { icon: '📐', label: 'Grammar',    color: 'text-blue-600 bg-blue-50' },
  reading:    { icon: '📖', label: 'Reading',    color: 'text-emerald-600 bg-emerald-50' },
  listening:  { icon: '🎧', label: 'Listening',  color: 'text-cyan-600 bg-cyan-50' },
  writing:    { icon: '✍️', label: 'Writing',    color: 'text-amber-600 bg-amber-50' },
};

const LEVEL_STYLES = {
  1: { label: 'Beginner',     color: 'from-emerald-500 to-emerald-400', icon: '🌱', bg: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', color: 'from-amber-500 to-amber-400',    icon: '📚', bg: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced',     color: 'from-rose-500 to-rose-400',      icon: '🎓', bg: 'bg-rose-50 text-rose-700' },
};

const TEST_DURATION_MINUTES = 20;

export default function LearnerTestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLevelUp = searchParams.get('mode') === 'levelup';

  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60); // seconds
  const [showCorrections, setShowCorrections] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const autoSubmitRef = useRef(false);

  const langId = localStorage.getItem('selectedLanguageId');

  const loadTest = useCallback(() => {
    if (!langId) { setPhase('no-language'); return; }
    setPhase('loading');
    getLearnerTest({ language_id: langId })
      .then(({ data }) => {
        if (data.already_taken) {
          setResult(data.result);
          setPhase('result');
        } else if (data.questions?.length > 0) {
          setQuestions(data.questions);
          setCurrentIdx(0);
          setAnswers({});
          setPhase('intro');
        } else {
          setPhase('no-questions');
        }
      })
      .catch(() => setPhase('error'));
  }, [langId]);

  // When mode=levelup, delete old result first then load fresh test
  useEffect(() => {
    if (isLevelUp && langId) {
      setPhase('loading');
      retakeLearnerTest({ language_id: langId })
        .then(() => loadTest())
        .catch(() => setPhase('error'));
    } else {
      loadTest();
    }
  }, [isLevelUp, langId, loadTest]);

  useEffect(() => {
    const handler = () => loadTest();
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, [loadTest]);

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isWriting = currentQ?.category === 'writing';
  const isListening = currentQ?.category === 'listening';

  const selectAnswer = (opt) => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  const goNext = () => { if (currentIdx < totalQ - 1) setCurrentIdx(currentIdx + 1); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); };

  // Timer: start when phase becomes 'test', clear on unmount or phase change
  useEffect(() => {
    if (phase === 'test') {
      setTimeLeft(TEST_DURATION_MINUTES * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmitRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (autoSubmitRef.current && timeLeft === 0 && phase === 'test') {
      autoSubmitRef.current = false;
      handleSubmitInner();
    }
  }, [timeLeft, phase]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitInner = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const payload = {
        language_id: langId,
        answers: Object.entries(answers).map(([qId, ans]) => ({
          question_id: Number(qId),
          answer: ans,
        })),
      };
      const { data } = await submitLearnerTest(payload);
      setResult(data.result);
      setCorrections(data.corrections || []);
      if (data.leveled_up) {
        setLeveledUp(true);
      }
      setPhase('result');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => handleSubmitInner();

  // ─── No language selected ───
  if (phase === 'no-language') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Placement Test</h1>
          <p className="text-sm text-gray-500 mt-1">Find your level and get personalized courses</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-4xl mb-4 block">🌍</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No language selected</h3>
          <p className="text-sm text-gray-400">Select a language from the header dropdown first.</p>
        </div>
      </div>
    );
  }

  // ─── Loading ───
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── No questions available ───
  if (phase === 'no-questions') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Placement Test</h1>
          <p className="text-sm text-gray-500 mt-1">Find your level and get personalized courses</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Test not available yet</h3>
          <p className="text-sm text-gray-400">The instructor hasn't added enough questions for this language yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (phase === 'error') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Placement Test</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h3>
          <button onClick={loadTest} className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer">Try Again</button>
        </div>
      </div>
    );
  }

  // ─── Result ───
  if (phase === 'result' && result) {
    const lvl = LEVEL_STYLES[result.level?.order] || LEVEL_STYLES[1];
    const pct = result.max_score > 0 ? Math.round((result.total_score / result.max_score) * 100) : 0;
    const perCatMax = result.max_score / 5;

    const catScores = [
      { key: 'vocab_score',     label: 'Vocabulary', icon: '📝', color: 'from-purple-500 to-purple-400' },
      { key: 'grammar_score',   label: 'Grammar',    icon: '📐', color: 'from-blue-500 to-blue-400' },
      { key: 'reading_score',   label: 'Reading',    icon: '📖', color: 'from-emerald-500 to-emerald-400' },
      { key: 'listening_score', label: 'Listening',  icon: '🎧', color: 'from-cyan-500 to-cyan-400' },
      { key: 'writing_score',   label: 'Writing',    icon: '✍️', color: 'from-amber-500 to-amber-400' },
    ];

    const correctCount = corrections.filter((c) => c.is_correct).length;
    const wrongCount = corrections.filter((c) => !c.is_correct).length;

    const circumference = 2 * Math.PI * 54;
    const strokeDash = (pct / 100) * circumference;
    const gradeLabel = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Great' : pct >= 50 ? 'Good' : pct >= 30 ? 'Fair' : 'Keep Going';
    const gradeColor = pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-rose-500';
    const strokeColor = pct >= 70 ? 'stroke-emerald-500' : pct >= 40 ? 'stroke-amber-500' : 'stroke-rose-500';

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Result</h1>
          <p className="text-sm text-gray-500 mt-1">Here's how you performed on the placement test</p>
        </div>

        {/* Score + Level Hero Card */}
        <div className={`bg-gradient-to-br ${lvl.color} rounded-2xl p-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Radial Score Gauge */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" className={strokeColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold">{pct}%</span>
                <span className={`text-xs font-semibold mt-0.5 ${gradeColor} bg-white/20 px-2 py-0.5 rounded-full`}>{gradeLabel}</span>
              </div>
            </div>
            {/* Level info */}
            <div className="text-center sm:text-left flex-1">
              <span className="text-5xl mb-3 block">{lvl.icon}</span>
              <h2 className="text-3xl font-bold mb-1">{result.level?.name}</h2>
              <p className="text-white/80 text-sm">Your proficiency level</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-2xl font-bold">{result.total_score}</span>
                <span className="text-white/70 text-sm">/ {result.max_score} pts</span>
              </div>
            </div>
          </div>
          {/* Quick stats row */}
          {corrections.length > 0 && (
            <div className="relative z-10 flex items-center justify-center gap-4 mt-6 pt-5 border-t border-white/15">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span className="text-sm font-bold">{correctCount}</span>
                <span className="text-xs text-white/70">correct</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                <span className="text-sm font-bold">{wrongCount}</span>
                <span className="text-xs text-white/70">incorrect</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                <span className="text-sm font-bold">{corrections.length}</span>
                <span className="text-xs text-white/70">total</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown — Visual Cards */}
        <div className="grid grid-cols-5 gap-3">
          {catScores.map((cat) => {
            const score = result[cat.key] || 0;
            const maxCat = perCatMax || 1;
            const catPct = Math.round((score / maxCat) * 100);
            return (
              <div key={cat.key} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow duration-200">
                <span className="text-2xl block mb-2">{cat.icon}</span>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                      className={catPct >= 70 ? 'text-emerald-500' : catPct >= 40 ? 'text-amber-500' : 'text-rose-400'}
                      strokeDasharray={`${(catPct / 100) * 125.7} 125.7`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-extrabold text-gray-700">{catPct}%</span>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-gray-600">{cat.label}</p>
                <p className="text-[10px] text-gray-400">{score}/{maxCat}</p>
              </div>
            );
          })}
        </div>

        {/* Corrections toggle */}
        {corrections.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowCorrections(!showCorrections)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-800">Review Your Answers</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-emerald-600 font-medium">{correctCount} correct</span>
                    {' · '}
                    <span className="text-red-500 font-medium">{wrongCount} incorrect</span>
                  </p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCorrections ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showCorrections && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {corrections.map((c, idx) => {
                  const cat = CATEGORY_META[c.category] || CATEGORY_META.vocabulary;
                  const isWriting = c.category === 'writing';
                  return (
                    <div key={c.question_id} className={`p-5 ${c.is_correct ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold ${
                          c.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {c.is_correct ? '✓' : '✗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-gray-400">Q{idx + 1}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cat.color}`}>
                              {cat.icon} {cat.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-2">{c.question_text}</p>

                          {!isWriting && c.options && (
                            <div className="space-y-1.5">
                              {Object.entries(c.options).map(([key, text]) => {
                                const isYourAnswer = c.your_answer === key;
                                const isCorrectOption = c.correct_answer === key;
                                let optClass = 'border-gray-100 bg-white text-gray-500';
                                if (isCorrectOption) optClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
                                if (isYourAnswer && !c.is_correct) optClass = 'border-red-200 bg-red-50 text-red-600 line-through';
                                if (isYourAnswer && c.is_correct) optClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
                                return (
                                  <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium ${optClass}`}>
                                    <span className="uppercase font-bold w-4 text-center">{key}</span>
                                    <span>{text}</span>
                                    {isCorrectOption && <span className="ml-auto text-emerald-600 text-[10px]">Correct</span>}
                                    {isYourAnswer && !c.is_correct && <span className="ml-auto text-red-500 text-[10px]">Your answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {isWriting && (
                            <div className="space-y-1.5 text-xs">
                              <div className={`px-3 py-2 rounded-lg border ${c.is_correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                <span className="font-semibold">Your answer:</span> {c.your_answer}
                              </div>
                              {!c.is_correct && (
                                <div className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                                  <span className="font-semibold">Correct answer:</span> {c.correct_answer}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center">
          <a href="/learner/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/20">
            Go to My Courses
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

        {/* Level-Up Celebration Overlay */}
        {leveledUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Level Up!</h2>
              <p className="text-gray-600 mb-2">Congratulations! You've advanced to</p>
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-lg font-bold text-white bg-gradient-to-r ${lvl.color} mb-6`}>
                <span className="text-2xl">{lvl.icon}</span>
                {result.level?.name}
              </div>
              <p className="text-sm text-gray-400 mb-6">Keep up the great work — new chapters await!</p>
              <button
                onClick={() => navigate('/learner/courses')}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 cursor-pointer"
              >
                Go to My Courses
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ─── Intro screen ───
  if (phase === 'intro') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isLevelUp ? 'Level-Up Test' : 'Placement Test'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLevelUp
              ? 'Complete this test to advance to the next level'
              : 'Find your level and get personalized courses'}
          </p>
        </div>

        {/* Level-up banner */}
        {isLevelUp && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="text-sm font-bold text-amber-800">You've completed all chapters!</h3>
              <p className="text-xs text-amber-600 mt-0.5">Pass this test to prove you're ready for the next level.</p>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border border-violet-100/50 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Answer Questions', desc: `${totalQ} questions covering 5 skill areas`, icon: '❓' },
              { step: '02', title: 'Auto-graded', desc: `${TEST_DURATION_MINUTES}-minute time limit, scored instantly`, icon: '⏱️' },
              { step: '03', title: isLevelUp ? 'Advance' : 'Get Your Level', desc: isLevelUp ? 'Move up to the next level' : 'Beginner, Intermediate, or Advanced', icon: '🎯' },
            ].map((item) => (
              <div key={item.step} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/80">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-bold text-violet-400 tracking-wider">STEP {item.step}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-[13px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Categories preview */}
        <div className="grid grid-cols-5 gap-2">
          {Object.values(CATEGORY_META).map((c) => (
            <div key={c.label} className={`${c.color} rounded-xl p-3 text-center`}>
              <span className="text-xl block mb-1">{c.icon}</span>
              <span className="text-[11px] font-semibold">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Test info */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Questions', value: totalQ, icon: '📋' },
            { label: 'Time Limit', value: `${TEST_DURATION_MINUTES} min`, icon: '⏱️' },
            { label: 'Categories', value: '5', icon: '📊' },
          ].map((i) => (
            <div key={i.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <span className="text-2xl mb-2 block">{i.icon}</span>
              <p className="text-xl font-bold text-gray-800">{i.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{i.label}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setPhase('test')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
          >
            {isLevelUp ? 'Start Level-Up Test' : 'Start Test'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ─── Test in progress ───
  if (phase === 'test' && currentQ) {
    const cat = CATEGORY_META[currentQ.category] || CATEGORY_META.vocabulary;
    const selected = answers[currentQ.id];
    const progress = ((currentIdx + 1) / totalQ) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress bar + Timer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Question {currentIdx + 1} of {totalQ}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{answeredCount} answered</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                timeLeft <= 60 ? 'bg-red-50 text-red-600 animate-pulse' :
                timeLeft <= 180 ? 'bg-amber-50 text-amber-600' :
                'bg-violet-50 text-violet-600'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${cat.color}`}>
            {cat.icon} {cat.label}
          </span>
          {isWriting && <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600">✏️ Type your answer</span>}
          {isListening && <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-cyan-50 text-cyan-600">🔊 Listen carefully</span>}
        </div>

        {/* Reading passage */}
        {currentQ.passage && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-emerald-600 mb-2">📖 Read the following passage:</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentQ.passage}</p>
          </div>
        )}

        {/* Listening audio player */}
        {isListening && currentQ.audio_url && (
          <div className="bg-cyan-50/60 border border-cyan-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-cyan-600 mb-3">🎧 Listen to the audio, then answer the question:</p>
            <div className="flex items-center justify-center">
              <audio controls ref={audioRef} className="w-full max-w-md" src={currentQ.audio_url}>
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{currentQ.question_text}</h2>

          {/* MCQ Options (vocabulary, grammar, reading, listening) */}
          {!isWriting && (
            <div className="space-y-3">
              {['a', 'b', 'c', 'd'].map((opt) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => selectAnswer(opt)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-violet-200 bg-white'
                    }`}
                  >
                    <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold uppercase transition-all ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {opt}
                    </span>
                    <span className={`text-sm ${isSelected ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                      {currentQ[`option_${opt}`]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Writing: text input */}
          {isWriting && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors"
                  placeholder="Type your answer here..."
                  autoFocus
                />
                {answers[currentQ.id] && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="w-6 h-6 flex items-center justify-center bg-violet-100 text-violet-600 rounded-full text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Type the correct word or phrase — minor typos are accepted, capitalization doesn't matter
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Previous
          </button>

          {currentIdx < totalQ - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer transition-colors shadow-sm shadow-violet-600/20"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQ || submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm shadow-green-600/20"
            >
              {submitting ? 'Submitting...' : `Submit (${answeredCount}/${totalQ})`}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {questions.map((q, idx) => {
            const qCat = CATEGORY_META[q.category];
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                title={`${qCat?.icon} Q${idx + 1}`}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  idx === currentIdx
                    ? 'bg-violet-500 text-white scale-110'
                    : answers[q.id]
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
