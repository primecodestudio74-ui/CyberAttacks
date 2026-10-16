import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

const TypingIndicator = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
    <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10">
      <ShieldAlert size={16} className="text-cyan-400" />
    </div>
    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-900/70 border border-slate-800 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-500"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.15 }}
        />
      ))}
    </div>
  </motion.div>
);

export default TypingIndicator;
