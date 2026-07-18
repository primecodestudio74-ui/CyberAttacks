import React, { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { CHAT_MAX_INPUT_LENGTH } from '../../config/chatbotConstants';

const ChatInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
      <textarea 
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value.slice(0, CHAT_MAX_INPUT_LENGTH));
          resize();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask about phishing, encryption, secure coding, career paths..."
        className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600 max-h-40 leading-relaxed disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-600 text-[#020617] hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 transition-colors"
      >
        <Send size={16} />
      </button>
    </div>
  );
};

export default ChatInput;
