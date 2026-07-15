import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Activity, Zap, Award, Flame, Bookmark as BookmarkIcon, BadgeCheck } from 'lucide-react';

import { apiBaseUrl } from '../../utils/api';

const cardBase =
  'bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-6 rounded-[2rem]';

function getAuthToken() {
  return localStorage.getItem('operator_token') || localStorage.getItem('token');
}

export default function LearningDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const token = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [meProgress, meBookmarks, meCertificates, meAchievements] = await Promise.all([
          fetch(`${apiBaseUrl}/api/learning/me/progress`, { headers }),
          fetch(`${apiBaseUrl}/api/learning/me/bookmarks`, { headers }),
          fetch(`${apiBaseUrl}/api/learning/me/certificates`, { headers }),
          fetch(`${apiBaseUrl}/api/learning/me/achievements`, { headers }),
        ]);

        if (!meProgress.ok) throw new Error('Failed to load progress');

        const p = await meProgress.json();
        const b = meBookmarks.ok ? await meBookmarks.json() : { bookmarks: [] };
        const c = meCertificates.ok ? await meCertificates.json() : { certificates: [] };
        const a = meAchievements.ok ? await meAchievements.json() : { achievements: [] };

        if (!alive) return;
        setProgress(p);
        setBookmarks(b.bookmarks || []);
        setCertificates(c.certificates || []);
        setAchievements(a.achievements || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load learning dashboard');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const overall = progress?.overall || {};
  const xp = overall.xp || 0;
  const level = overall.level || 1;
  const streak = overall.streak || 0;

  const continueLearning = useMemo(() => {
    // MVP: if bookmarks exist, take the first bookmarked lesson
    if (bookmarks?.length) {
      const first = bookmarks[0]?.lesson?._id || bookmarks[0]?.lessonId;
      return first ? { lessonId: first, label: 'Continue from your bookmark' } : null;
    }
    return null;
  }, [bookmarks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 lg:p-12 max-w-6xl mx-auto w-full"
    >
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tight">
            Learning Module
          </h1>
          <p className="text-[11px] text-slate-500 font-mono mt-2 uppercase tracking-widest">
            Courses • Lessons • Quizzes • XP • Badges • Certificates
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Zap className="text-cyan-500" size={18} />} label="XP" value={`${xp}`} onClick={() => navigate('/dashboard/learning/courses')} />
        <StatCard icon={<Award className="text-fuchsia-500" size={18} />} label="Level" value={`${level}`} />
        <StatCard icon={<Flame className="text-emerald-500" size={18} />} label="Daily Streak" value={`${streak}`} />
        <StatCard icon={<BadgeCheck className="text-orange-500" size={18} />} label="Certificates" value={`${(certificates || []).length}`} />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className={cardBase + ' lg:col-span-2'}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-cyan-400" size={18} />
              <h2 className="text-white font-black uppercase tracking-widest text-[12px]">Continue Learning</h2>
            </div>
            <button
              onClick={() => navigate('/dashboard/learning/courses')}
              className="px-4 py-2 text-[11px] bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all uppercase tracking-[0.2em]"
            >
              Browse Courses
            </button>
          </div>

          {continueLearning ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40">
              <p className="text-slate-400 text-sm">{continueLearning.label}</p>
              <div className="flex items-center justify-between gap-4 mt-3">
                <p className="text-white font-black">Next lesson</p>
                <button
                  onClick={() => navigate(`/dashboard/learning/lessons/${continueLearning.lessonId}`)}
                  className="px-4 py-2 bg-cyan-600 text-[#020617] font-black rounded-xl hover:bg-cyan-500 transition-all text-[11px] uppercase tracking-[0.2em]"
                >
                  Open Lesson
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40">
              <p className="text-slate-400 text-sm">
                No recent bookmarks yet. Start a course to generate your learning streak and progress.
              </p>
            </div>
          )}
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-cyan-500" size={18} />
            <h2 className="text-white font-black uppercase tracking-widest text-[12px]">Overall Progress</h2>
          </div>
          <ProgressRow label="Completed Courses" value={(overall.completedCourseIds || []).length} />
          <ProgressRow label="Completed Lessons" value={(overall.completedLessonIds || []).length} />
          <ProgressRow label="Quiz Attempts" value={(overall.quizAttempts || []).length} />

          <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
            XP drives level • streak drives motivation
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardBase}>
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-fuchsia-500" size={18} />
            <h2 className="text-white font-black uppercase tracking-widest text-[12px]">Badges & Achievements</h2>
          </div>

          {(achievements || []).length ? (
            <div className="grid grid-cols-2 gap-3">
              {(achievements || []).slice(0, 6).map((a) => (
                <div key={a._id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40">
                  <div className="text-white font-black text-[11px]">{a.title}</div>
                  <div className="text-slate-500 text-[10px] mt-1">{a.description || ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Achievements will appear here as you learn.</div>
          )}
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-3 mb-4">
            <BookmarkIcon className="text-emerald-500" size={18} />
            <h2 className="text-white font-black uppercase tracking-widest text-[12px]">Bookmarked Lessons</h2>
          </div>

          {(bookmarks || []).length ? (
            <div className="space-y-2">
              {bookmarks.slice(0, 5).map((b) => {
                const lesson = b?.lesson;
                const id = lesson?._id || b?.lessonId;
                const title = lesson?.title || 'Lesson';
                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/dashboard/learning/lessons/${id}`)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="text-white font-black text-[11px] uppercase italic">{title}</div>
                    <div className="text-slate-500 text-[10px] mt-1">Open bookmarked content</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">No bookmarks yet. Bookmark lessons from the viewer.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, onClick }) {
  const body = (
    <div className="bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-6 rounded-[2rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{label}</div>
        </div>
        <div className="text-cyan-400 font-black text-2xl">{value}</div>
      </div>
      <div className="mt-3 h-[1px] bg-slate-800/50" />
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-3">Tap for courses & XP</div>
    </div>
  );

  if (!onClick) return body;
  return (
    <button onClick={onClick} className="w-full text-left">
      {body}
    </button>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-b-0">
      <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{label}</div>
      <div className="text-white font-black text-[12px]">{value}</div>
    </div>
  );
}

