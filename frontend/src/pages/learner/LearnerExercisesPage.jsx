import { useState, useEffect, useCallback } from 'react';
import { generateExercises } from '../../api/auth';

// ─── Colour palette per exercise type ────────────────────────────────────────
const TYPE_META = {
  multiple_choice:   { label: 'Multiple Choice',    icon: '🔘', border: 'border-t-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  fill_in_the_blank: { label: 'Fill in the Blank',  icon: '📝', border: 'border-t-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  matching:          { label: 'Matching',            icon: '🔗', border: 'border-t-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  translation:       { label: 'Translation',         icon: '🌐', border: 'border-t-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  listening:         { label: 'Listening',           icon: '🎧', border: 'border-t-rose-500',    badge: 'bg-rose-100 text-rose-700' },
  reading:           { label: 'Reading',             icon: '📖', border: 'border-t-cyan-500',    badge: 'bg-cyan-100 text-cyan-700' },
};

// ─── Result badge ─────────────────────────────────────────────────────────────
function ResultBadge({ correct }) {
  if (correct === null) return null;
  return correct
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✓ Correct</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">✗ Wrong</span>;
}

// ─── Multiple Choice ──────────────────────────────────────────────────────────
function MultipleChoiceCard({ data }) {
  const [selected, setSelected] = useState(null);
  const correct = selected ? selected === data.correct.charAt(0) : null;

  return (
    <div className="space-y-3">
      <p className="font-medium text-gray-800">{data.question}</p>
      <div className="space-y-2">
        {data.options.map((opt) => {
          const letter = opt.charAt(0);
          const isSelected = selected === letter;
          const isCorrect  = letter === data.correct.charAt(0);
          let cls = 'w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ';
          if (!selected) {
            cls += 'border-gray-200 hover:border-violet-400 hover:bg-violet-50 text-gray-700 cursor-pointer';
          } else if (isCorrect) {
            cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
          } else if (isSelected) {
            cls += 'border-red-400 bg-red-50 text-red-700';
          } else {
            cls += 'border-gray-100 text-gray-400 cursor-default';
          }
          return (
            <button key={letter} className={cls} disabled={!!selected} onClick={() => setSelected(letter)}>
              {opt}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <ResultBadge correct={correct} />
        {selected && <p className="text-xs text-gray-500 italic">{data.explanation}</p>}
      </div>
    </div>
  );
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────
function FillBlankCard({ data }) {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);

  const check = () => {
    setResult(input.trim().toLowerCase() === data.answer.trim().toLowerCase());
  };

  return (
    <div className="space-y-3">
      <p className="font-medium text-gray-800">{data.sentence}</p>
      {data.hint && <p className="text-xs text-gray-400 italic">Hint: {data.hint}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && result === null && check()}
          disabled={result !== null}
          placeholder="Type your answer…"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
        />
        {result === null && (
          <button onClick={check} disabled={!input.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40">
            Check
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ResultBadge correct={result} />
        {result === false && <p className="text-xs text-gray-500">Answer: <span className="font-semibold">{data.answer}</span></p>}
      </div>
    </div>
  );
}

// ─── Matching ─────────────────────────────────────────────────────────────────
function MatchingCard({ data }) {
  const pairs   = data.pairs ?? [];
  const lefts   = pairs.map(p => p.left);
  const rights  = pairs.map(p => p.right).sort(() => Math.random() - 0.5);

  const [selectedLeft, setSelectedLeft]   = useState(null);
  const [matched, setMatched]             = useState({});   // left → right
  const [wrongPair, setWrongPair]         = useState(null);

  const handleRight = useCallback((right) => {
    if (!selectedLeft) return;
    const correctRight = pairs.find(p => p.left === selectedLeft)?.right;
    if (right === correctRight) {
      setMatched(prev => ({ ...prev, [selectedLeft]: right }));
      setSelectedLeft(null);
    } else {
      setWrongPair({ left: selectedLeft, right });
      setTimeout(() => setWrongPair(null), 800);
      setSelectedLeft(null);
    }
  }, [selectedLeft, pairs]);

  const allDone = Object.keys(matched).length === pairs.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Click a left item then match it to the right.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {lefts.map(left => {
            const isMatched  = !!matched[left];
            const isSelected = selectedLeft === left;
            const isWrong    = wrongPair?.left === left;
            return (
              <button key={left}
                onClick={() => !isMatched && setSelectedLeft(left)}
                disabled={isMatched}
                className={`w-full px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                  isMatched   ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 cursor-default' :
                  isSelected  ? 'border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-200' :
                  isWrong     ? 'border-red-400 bg-red-50 text-red-700' :
                  'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 cursor-pointer'
                }`}>
                {left}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map(right => {
            const isMatched = Object.values(matched).includes(right);
            const isWrong   = wrongPair?.right === right;
            return (
              <button key={right}
                onClick={() => !isMatched && handleRight(right)}
                disabled={isMatched || !selectedLeft}
                className={`w-full px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                  isMatched ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 cursor-default' :
                  isWrong   ? 'border-red-400 bg-red-50 text-red-700' :
                  !selectedLeft ? 'border-gray-100 text-gray-400 cursor-default' :
                  'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 cursor-pointer'
                }`}>
                {right}
              </button>
            );
          })}
        </div>
      </div>
      {allDone && <ResultBadge correct={true} />}
    </div>
  );
}

// ─── Translation ──────────────────────────────────────────────────────────────
function TranslationCard({ data }) {
  const [input, setInput]       = useState('');
  const [submitted, setSubmit]  = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{data.source_language} → {data.target_language}</p>
      <p className="font-medium text-gray-800 p-3 bg-amber-50 rounded-xl border border-amber-100">{data.source_text}</p>
      <textarea
        rows={3}
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={submitted}
        placeholder="Write your translation…"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none disabled:bg-gray-50"
      />
      {!submitted ? (
        <button onClick={() => setSubmit(true)} disabled={!input.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40">
          Check
        </button>
      ) : (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
          <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Suggested answer</p>
          <p className="text-gray-700">{data.suggested_answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Listening ────────────────────────────────────────────────────────────────
function ListeningCard({ data }) {
  const [played, setPlayed]   = useState(false);
  const [selected, setSelected] = useState(null);
  const correct = selected ? selected === data.correct.charAt(0) : null;

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(data.text_to_speak);
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
    setPlayed(true);
  };

  return (
    <div className="space-y-3">
      <button onClick={speak}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
        <span>▶</span> {played ? 'Play Again' : 'Play Audio'}
      </button>
      {played && (
        <>
          <p className="font-medium text-gray-800">{data.question}</p>
          <div className="space-y-2">
            {data.options.map((opt) => {
              const letter    = opt.charAt(0);
              const isSelected = selected === letter;
              const isCorrect  = letter === data.correct.charAt(0);
              let cls = 'w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ';
              if (!selected) {
                cls += 'border-gray-200 hover:border-rose-400 hover:bg-rose-50 text-gray-700 cursor-pointer';
              } else if (isCorrect) {
                cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
              } else if (isSelected) {
                cls += 'border-red-400 bg-red-50 text-red-700';
              } else {
                cls += 'border-gray-100 text-gray-400 cursor-default';
              }
              return (
                <button key={letter} className={cls} disabled={!!selected} onClick={() => setSelected(letter)}>
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <ResultBadge correct={correct} />
            {selected && <p className="text-xs text-gray-500 italic">{data.explanation}</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Reading ──────────────────────────────────────────────────────────────────
function ReadingCard({ data }) {
  const [selected, setSelected] = useState(null);
  const correct = selected ? selected === data.correct.charAt(0) : null;

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
        {data.passage}
      </div>
      <p className="font-medium text-gray-800">{data.question}</p>
      <div className="space-y-2">
        {data.options.map((opt) => {
          const letter    = opt.charAt(0);
          const isSelected = selected === letter;
          const isCorrect  = letter === data.correct.charAt(0);
          let cls = 'w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ';
          if (!selected) {
            cls += 'border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 text-gray-700 cursor-pointer';
          } else if (isCorrect) {
            cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
          } else if (isSelected) {
            cls += 'border-red-400 bg-red-50 text-red-700';
          } else {
            cls += 'border-gray-100 text-gray-400 cursor-default';
          }
          return (
            <button key={letter} className={cls} disabled={!!selected} onClick={() => setSelected(letter)}>
              {opt}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <ResultBadge correct={correct} />
        {selected && <p className="text-xs text-gray-500 italic">{data.explanation}</p>}
      </div>
    </div>
  );
}

// ─── Exercise Card Shell ──────────────────────────────────────────────────────
function ExerciseCard({ type, data }) {
  const meta = TYPE_META[type];
  if (!meta || !data) return null;

  const ContentMap = {
    multiple_choice:   <MultipleChoiceCard data={data} />,
    fill_in_the_blank: <FillBlankCard      data={data} />,
    matching:          <MatchingCard        data={data} />,
    translation:       <TranslationCard     data={data} />,
    listening:         <ListeningCard       data={data} />,
    reading:           <ReadingCard         data={data} />,
  };

  return (
    <div className={`bg-white rounded-2xl border-t-4 border border-gray-100 shadow-sm ${meta.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{meta.icon}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.badge}`}>{meta.label}</span>
        </div>
        {ContentMap[type]}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearnerExercisesPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const languageId = localStorage.getItem('selectedLanguageId');

  const [errorDetail, setErrorDetail] = useState(null);

  const load = useCallback(async () => {
    if (!languageId) {
      setError('No language selected. Please choose a language from the Languages page first.');
      setErrorDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    setData(null);
    try {
      const result = await generateExercises(languageId);
      setData(result);
    } catch (err) {
      const status  = err?.response?.status;
      const resData = err?.response?.data;
      const msg     = resData?.error
                    ?? resData?.message
                    ?? (status ? `HTTP ${status} error` : 'Network error — check that the backend is running.');
      setError(msg);
      setErrorDetail(resData?.details ?? null);
      console.error('[ExercisePage]', status, resData);
    } finally {
      setLoading(false);
    }
  }, [languageId]);

  useEffect(() => { load(); }, [load]);

  const EXERCISE_ORDER = ['multiple_choice', 'fill_in_the_blank', 'matching', 'translation', 'listening', 'reading'];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Exercises</h1>
            <p className="text-sm text-gray-500 mt-1">AI is generating personalized exercises for you…</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Crafting exercises tailored to your level…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Exercises</h1>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 flex flex-col items-center gap-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm text-red-600 font-medium text-center max-w-lg">{error}</p>
          {errorDetail && (
            <pre className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 max-w-lg w-full overflow-x-auto text-left">
              {JSON.stringify(errorDetail, null, 2)}
            </pre>
          )}
          <button onClick={load}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Loaded ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Exercises</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {data.language} · <span className="font-semibold text-violet-600">{data.level}</span>
              {' · Focused on '}
              <span className="font-semibold text-amber-600">{data.weak_categories?.join(' & ')}</span>
            </p>
          )}
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Generate New Exercises
        </button>
      </div>

      {/* Focus banner */}
      {data?.weak_categories?.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800">
          <span className="text-lg">🎯</span>
          <span>Today's focus: <strong>{data.weak_categories.join(' & ')}</strong> — these are your weakest areas to improve.</span>
        </div>
      )}

      {/* Exercise cards */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {EXERCISE_ORDER.map(type => (
            <ExerciseCard key={type} type={type} data={data.exercises?.[type]} />
          ))}
        </div>
      )}
    </div>
  );
}
