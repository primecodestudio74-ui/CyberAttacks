import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Bookmark as BookmarkIcon, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiBaseUrl } from '../../utils/api';

function getAuthToken() {
  return localStorage.getItem('operator_token') || localStorage.getItem('token');
}

function renderBlocks(blocks = []) {
  return (blocks || []).map((b, idx) => {
    const type = b.type || 'paragraph';
    const key = `${type}-${idx}`;

    if (type === 'heading') {
      return (
        <h3 key={key} className="text-white font-black uppercase tracking-wide text-[14px] mt-6 mb-2">
          {b.text || b.title || ''}
        </h3>
      );
    }

    if (type === 'list') {
      const items = b.items || b.bullets || [];
      return (
        <ul key={key} className="list-disc pl-6 text-slate-300 text-[13px] mt-3">
          {items.map((it, i) => (
            <li key={i} className="mt-1">
              {it}
            </li>
          ))}
        </ul>
      );
    }

    if (type === 'code') {
      return (
        <pre key={key} className="mt-4 rounded-2xl bg-slate-950/60 border border-slate-800 p-4 overflow-x-auto">
          <code className="text-cyan-300 text-[12px] font-mono">{b.code || b.text || ''}</code>
        </pre>
      );
    }

    if (type === 'note' || type === 'tip') {
      return (
        <div key={key} className="mt-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
          <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{type === 'tip' ? 'Tip' : 'Important Note'}</div>
          <div className="text-slate-300 text-[13px] mt-1">{b.text || b.title || ''}</div>
        </div>
      );
    }

    if (type === 'image' || type === 'diagram') {
      const url = b.url || b.src || '';
      const alt = b.alt || '';
      return (
        <div key={key} className="mt-5">
          {url ? (
            <img src={url} alt={alt} className="w-full max-h-[360px] object-contain rounded-2xl border border-slate-800" />
          ) : null}
          {b.caption ? <div className="text-slate-500 text-[11px] mt-2">{b.caption}</div> : null}
        </div>
      );
    }

    // default paragraph
    return (
      <p key={key} className="text-slate-300 text-[13px] leading-relaxed mt-3">
        {b.text || b.description || ''}
      </p>
    );
  });
}

export default function LessonViewer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => getAuthToken(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [prevNext, setPrevNext] = useState({ prev: null, next: null });

  const [completed, setCompleted] = useState(false);
  const [bookmarkOn, setBookmarkOn] = useState(false);

  const [quizState, setQuizState] = useState({
    answers: [],
    feedback: null,
    submitting: false,
  });

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = { Authorization: `Bearer ${token}` };

        const [lessonRes, navRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/learning/lessons/${lessonId}`, { headers }),
          fetch(`${apiBaseUrl}/api/learning/lessons/${lessonId}/prevnext`, { headers }),
        ]);

        if (!lessonRes.ok) throw new Error('Failed to load lesson');
        const lessonData = await lessonRes.json();

        if (!navRes.ok) throw new Error('Failed to load navigation');
        const navData = await navRes.json();

        if (!alive) return;
        setLesson(lessonData.lesson);
        setModule(lessonData.module);
        setCourse(lessonData.course);
        setPrevNext({ prev: navData.prev, next: navData.next });
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load lesson viewer');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [lessonId, token]);

  const doCompleteLesson = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBaseUrl}/api/learning/progress/complete-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ lessonId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to complete lesson');

      setCompleted(true);
      return data;
    } catch (e) {
      setError(e?.message || 'Failed to complete lesson');
      return null;
    }
  };

  const toggleBookmark = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBaseUrl}/api/learning/bookmarks/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ lessonId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to toggle bookmark');

      setBookmarkOn(!!data.bookmarked);
    } catch (e) {
      setError(e?.message || 'Failed to toggle bookmark');
    }
  };

  const handleQuizAnswerChange = (idx, value, multi = false) => {
    setQuizState((s) => {
      const next = Array.isArray(s.answers) ? [...s.answers] : [];
      if (multi) next[idx] = value;
      else next[idx] = value;
      return { ...s, answers: next, feedback: null };
    });
  };

  const submitQuiz = async () => {
    try {
      setQuizState((s) => ({ ...s, submitting: true, feedback: null }));
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${apiBaseUrl}/api/learning/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ lessonId, answers: quizState.answers || [] }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to submit quiz');

      setQuizState((s) => ({ ...s, submitting: false, feedback: data }));

      // If quiz should mark completion, server already updates completedLessonIds.
      // We will also show a completion check UI for immediate feedback.
      if (data?.passed) setCompleted(true);
    } catch (e) {
      setQuizState((s) => ({ ...s, submitting: false }));
      setError(e?.message || 'Quiz submit failed');
    }
  };

  const quiz = lesson?.quizId;

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-12 max-w-6xl mx-auto w-full">
        <div className="text-slate-400">Loading lesson...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 lg:p-12 max-w-6xl mx-auto w-full"
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/learning/courses')}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <BookOpen size={16} /> Back to Courses
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleBookmark}
            className={`px-3 py-2 rounded-xl border transition-all text-[11px] uppercase tracking-[0.2em] font-black ${
              bookmarkOn
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-slate-500 border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 hover:text-emerald-300'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <BookmarkIcon size={14} /> {bookmarkOn ? 'Saved' : 'Bookmark'}
            </span>
          </button>

          {completed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] uppercase tracking-[0.2em] font-black">
              <CheckCircle2 size={16} /> Completed
            </div>
          ) : (
            <button
              onClick={doCompleteLesson}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-[#020617] font-black hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em]"
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {lesson && (
        <>
          <div className="bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-8 rounded-[2rem] mb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[10px] font-black text-slate-600 bg-slate-900 border border-slate-800 px-2 py-1 rounded tracking-[0.2em] inline-block">
                  {course?.category || 'Cybersecurity'}
                </div>
                <h1 className="text-3xl font-black text-white mt-3 uppercase italic">{lesson.title}</h1>
                {lesson.description ? (
                  <p className="text-slate-500 text-[12px] font-medium leading-relaxed mt-3">{lesson.description}</p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Module</div>
                <div className="text-white font-black text-xl mt-2">{module?.title || '—'}</div>
              </div>
            </div>

            {lesson.learningObjectives?.length ? (
              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Learning Objectives</div>
                <ul className="mt-3 space-y-2">
                  {lesson.learningObjectives.map((o, idx) => (
                    <li key={idx} className="text-slate-300 text-[13px] flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Lesson Content</div>
              {renderBlocks(lesson.content || [])}

              {/* Security tips / real world examples are expected to be present inside content blocks */}
            </div>
          </div>

          {/* Quiz */}
          {quiz ? (
            <div className="bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-8 rounded-[2rem] mb-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <span className="text-cyan-400 font-black">Q</span>
                  </div>
                  <div>
                    <div className="text-white font-black uppercase italic">Quiz</div>
                    <div className="text-slate-500 text-[11px] mt-1">Instant feedback • XP rewards</div>
                  </div>
                </div>

                <div className="text-slate-500 text-[10px] uppercase tracking-widest">
                  Passing: {quiz.passingScorePercent || 70}%
                </div>
              </div>

              <div className="space-y-6">
                {(quiz.questions || []).map((q, idx) => {
                  const qType = q.type || (q.correctAnswers ? 'multiple_select' : 'multiple_choice');

                  if (qType === 'multiple_select') {
                    const choices = q.choices || q.options || [];
                    const correctAnswers = q.correctAnswers || [];

                    const current = Array.isArray(quizState.answers?.[idx]) ? quizState.answers[idx] : [];

                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                        <div className="text-white font-black text-[12px] uppercase italic">Q{idx + 1}. {q.prompt || q.text || ''}</div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {choices.map((c, i) => {
                            const val = c.value ?? c.id ?? c;
                            const checked = current.includes(val);
                            return (
                              <label key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...current, val] : current.filter((x) => String(x) !== String(val));
                                    handleQuizAnswerChange(idx, next, true);
                                  }}
                                />
                                <span className="text-slate-300 text-[12px]">{c.label ?? c.text ?? c.title ?? String(c)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // multiple_choice / true_false
                  const choices = q.choices || q.options || [];
                  const current = quizState.answers?.[idx];
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                      <div className="text-white font-black text-[12px] uppercase italic">Q{idx + 1}. {q.prompt || q.text || ''}</div>

                      {(qType === 'true_false' || qType === 'true_false'.toLowerCase()) ? (
                        <div className="mt-3 flex gap-3">
                          {['True', 'False'].map((label) => {
                            const val = label === 'True';
                            const selected = current === val;
                            return (
                              <button
                                type="button"
                                key={label}
                                onClick={() => handleQuizAnswerChange(idx, val)}
                                className={`px-4 py-2 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all ${
                                  selected
                                    ? 'bg-cyan-600 border-cyan-500/30 text-[#020617]'
                                    : 'bg-slate-900/30 border-slate-800/50 text-slate-300 hover:bg-slate-900/50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {choices.map((c, i) => {
                            const val = c.value ?? c.id ?? c;
                            const selected = String(current) === String(val);
                            return (
                              <button
                                type="button"
                                key={i}
                                onClick={() => handleQuizAnswerChange(idx, val)}
                                className={`px-3 py-2 rounded-xl border text-left text-[12px] font-black transition-all ${
                                  selected
                                    ? 'bg-cyan-600 border-cyan-500/30 text-[#020617]'
                                    : 'bg-slate-900/30 border-slate-800/50 text-slate-300 hover:bg-slate-900/50'
                                }`}
                              >
                                {c.label ?? c.text ?? c.title ?? String(c)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  onClick={submitQuiz}
                  disabled={quizState.submitting}
                  className="px-6 py-3 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em] disabled:opacity-60"
                >
                  {quizState.submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>

                {quizState.feedback ? (
                  <div className="text-slate-200 text-[12px]">
                    <div className="font-black uppercase tracking-widest">
                      Score: {quizState.feedback.scorePercent}% • XP: {quizState.feedback.xpEarned}
                    </div>
                    <div className={`mt-1 ${quizState.feedback.passed ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {quizState.feedback.passed ? 'Passed' : 'Not yet passed'}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[12px]">Answer all questions, then submit.</div>
                )}
              </div>
            </div>
          ) : null}

          {/* Prev / Next */}
          <div className="flex items-center justify-between gap-4">
            <button
              disabled={!prevNext.prev}
              onClick={() => prevNext.prev && navigate(`/dashboard/learning/lessons/${prevNext.prev._id}`)}
              className={`px-4 py-3 rounded-xl border text-[11px] uppercase tracking-[0.2em] font-black transition-all ${
                prevNext.prev
                  ? 'bg-slate-900/30 border-slate-800/50 text-slate-300 hover:bg-slate-900/50 hover:text-cyan-300'
                  : 'bg-slate-900/10 border-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} /> Previous
              </span>
            </button>

            <div className="text-slate-500 text-[10px] uppercase tracking-widest">Module Navigation</div>

            <button
              disabled={!prevNext.next}
              onClick={() => prevNext.next && navigate(`/dashboard/learning/lessons/${prevNext.next._id}`)}
              className={`px-4 py-3 rounded-xl border text-[11px] uppercase tracking-[0.2em] font-black transition-all ${
                prevNext.next
                  ? 'bg-slate-900/30 border-slate-800/50 text-slate-300 hover:bg-slate-900/50 hover:text-cyan-300'
                  : 'bg-slate-900/10 border-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                Next <ArrowRight size={14} />
              </span>
            </button>
          </div>
        </>
      )}

      {!lesson && !error ? <div className="text-slate-400">No lesson found.</div> : null}
    </motion.div>
  );
}

