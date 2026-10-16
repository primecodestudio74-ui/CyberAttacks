import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiBaseUrl } from '../../utils/api';
import { Search, Filter, ChevronRight } from 'lucide-react';

const categories = [
  'Cybersecurity Fundamentals',
  'Network Security',
  'Web Security',
  'Password Security',
  'Malware',
  'Phishing',
  'Social Engineering',
  'Mobile Security',
  'Cloud Security',
  'Cryptography',
  'Digital Forensics',
  'Ethical Hacking Basics',
  'OWASP Top 10',
];

function getAuthToken() {
  return localStorage.getItem('operator_token') || localStorage.getItem('token');
}

export default function CourseListing() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const token = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (category) params.set('category', category);
        if (difficulty) params.set('difficulty', difficulty);

        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${apiBaseUrl}/api/learning/courses?${params.toString()}`, { headers });
        if (!res.ok) throw new Error('Failed to load courses');
        const data = await res.json();

        if (!alive) return;
        setCourses(data.courses || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load courses');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [token, search, category, difficulty]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 lg:p-12 max-w-6xl mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tight">Courses</h1>
          <p className="text-[11px] text-slate-500 font-mono mt-2 uppercase tracking-widest">Search • Filter • Start Learning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
            <Search size={16} className="text-cyan-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses / objectives"
              className="bg-transparent outline-none text-slate-100 w-full placeholder:text-slate-600 text-[12px]"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
            <Filter size={16} className="text-cyan-400" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-transparent outline-none text-slate-100 w-full text-[12px]"
            >
              <option value="">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent outline-none text-slate-100 w-full text-[12px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading courses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(`/dashboard/learning/courses/${c._id}`)}
              className="text-left bg-[#030712]/40 backdrop-blur-sm border border-slate-800/50 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black text-slate-600 bg-slate-900 border border-slate-800 px-2 py-1 rounded tracking-[0.2em] inline-block">
                    {c.category}
                  </div>
                  <h2 className="text-white font-black text-lg mt-3 uppercase italic">{c.title}</h2>
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-2">{c.description}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-emerald-500/5 text-emerald-500 border border-emerald-500/20">
                      {c.difficulty}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-cyan-400 shrink-0" />
              </div>
            </button>
          ))}

          {!courses.length && (
            <div className="text-slate-400 md:col-span-2">No courses found for current filters.</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

