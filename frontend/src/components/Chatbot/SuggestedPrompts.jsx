import React from 'react';
import { Sparkles } from 'lucide-react';

const SuggestedPrompts = ({ prompts, onSelect, disabled }) => {
  if (!prompts?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={11} className="text-cyan-600" />
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
