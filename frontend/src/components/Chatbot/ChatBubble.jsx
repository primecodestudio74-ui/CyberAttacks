import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, User, RotateCcw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatBubble = ({ message, onRetry }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div
          className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
            message.isError ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/30'
          }`}
        >
          <ShieldAlert size={16} className={message.isError ? 'text-red-400' : 'text-cyan-400'} />
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm ${
            isUser
              ? 'bg-cyan-600 text-[#020617] font-medium rounded-tr-sm'
              : message.isError
              ? 'bg-red-950/30 border border-red-500/30 text-red-300 rounded-tl-sm'
              : 'bg-slate-900/70 border border-slate-800 text-slate-300 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            {formatTime(message.timestamp)}
          </span>
          {message.isError && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <RotateCcw size={10} /> Retry
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border border-slate-700 bg-slate-800">
          <User size={16} className="text-slate-300" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;
