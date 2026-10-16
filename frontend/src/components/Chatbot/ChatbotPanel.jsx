import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Trash2, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useChatbot from '../../hooks/useChatbot';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import SuggestedPrompts from './SuggestedPrompts';
import ChatInput from './ChatInput';

const ChatbotPanel = () => {
  const { messages, isSending, suggestions, sendMessage, retryLastMessage, clearChat, canRetry, authError } =
    useChatbot();
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const showSuggestions = messages.length <= 1 && !isSending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col flex-1 min-h-0 max-w-4xl mx-auto w-full px-4 lg:px-0 py-4 sm:py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <ShieldAlert size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase italic tracking-wide">Ask Me</h2>
            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-[0.25em]">
              Cyber Security Assistant
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Auth error banner */}
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3"
        >
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-300 uppercase tracking-widest">Session Expired</p>
            <p className="text-[12px] text-amber-200/80 mt-1 leading-relaxed">{authError}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <LogIn size={12} /> Login Again
            </button>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-800/60 bg-[#030712]/40 backdrop-blur-sm p-4 sm:p-6 space-y-5 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} onRetry={message.isError && canRetry ? retryLastMessage : undefined} />
          ))}
        </AnimatePresence>
        {isSending && <TypingIndicator />}
      </div>

      {/* Suggestions + Input */}
      <div className="mt-4 space-y-3">
        {showSuggestions && (
          <SuggestedPrompts prompts={suggestions} onSelect={sendMessage} disabled={isSending} />
        )}
        <ChatInput onSend={sendMessage} disabled={isSending || Boolean(authError)} />
        <p className="text-center text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em]">
          Enter to send &middot; Shift + Enter for new line &middot; Scoped to Cyber Security topics
          {messages.some(m => m.source === 'local-fallback') && (
            <span className="ml-2 text-amber-600">· Offline mode active</span>
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatbotPanel;
