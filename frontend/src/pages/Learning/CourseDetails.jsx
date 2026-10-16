import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronLeft } from 'lucide-react';
import { apiBaseUrl } from '../../utils/api';

function getAuthToken() {
  return localStorage.getItem('operator_token') || localStorage.getItem('token');
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => getAuthToken(), []);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${apiBaseUrl}/api/learning/courses/${courseId}`, { headers });
        if (!res.ok) throw new Error('Failed to load course');
        const data = await res.json();

        if (!alive) return;
        setCourse(data.course);
        setModules(data.modules || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load course');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [courseId, token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 lg:p-12 max-w-6xl mx-auto w-full"
    >
      <button
        onClick={() => navigate('/dashboard/learning/courses')}
        className="inline-flex items-center gap-2 text-slate-300 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Courses
      </button>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading modules...</div>
      ) : (
        <>
          {course && (
            <div className="bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-8 rounded-[2rem] mb-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black text-slate-600 bg-slate-900 border border-slate-800 px-2 py-1 rounded tracking-[0.2em] inline-block">
                    {course.category}
                  </div>
                  <h1 className="text-3xl font-black text-white mt-3 uppercase italic">{course.title}</h1>
                  <p className="text-slate-500 text-[12px] font-medium leading-relaxed mt-3">{course.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">Difficulty</div>
                  <div className="text-white font-black text-2xl mt-2">{course.difficulty}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {modules.map((m, idx) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-6 rounded-[2rem]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen size={18} className="text-cyan-400" />
                  <div className="text-white font-black uppercase tracking-widest text-[12px]">Module {idx + 1}</div>
                </div>
                <h2 className="text-white font-black text-lg uppercase italic">{m.title}</h2>
                {m.description && <p className="text-slate-500 text-[11px] mt-2">{m.description}</p>}

                {/* MVP note: we only have a modules list API; lessons list per module is not implemented.
                    We'll show a fallback message. */}
                <div className="mt-4 text-slate-500 text-[10px] uppercase tracking-widest">
                  Lessons navigation will load inside Lesson Viewer once lesson IDs are available.
                </div>
              </motion.div>
            ))}

            {!modules.length && <div className="text-slate-400">No modules found.</div>}
          </div>
        </>
      )}
    </motion.div>
  );
}

