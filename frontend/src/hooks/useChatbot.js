import { useState, useEffect, useCallback, useRef } from 'react';
import { sendChatMessage, fetchSuggestedPrompts } from '../services/chatbotService';
import {
  CHAT_HISTORY_STORAGE_KEY,
  FALLBACK_SUGGESTED_PROMPTS,
  WELCOME_MESSAGE,
} from '../config/chatbotConstants';

let idCounter = 0;
const nextId = () => `msg_${Date.now()}_${idCounter++}`;

const loadPersistedMessages = () => {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
};

export default function useChatbot() {
  const [messages, setMessages] = useState(
    () => loadPersistedMessages() || [{ ...WELCOME_MESSAGE, id: nextId(), timestamp: Date.now() }]
  );
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTED_PROMPTS);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [authError, setAuthError] = useState(null);
  const lastFailedMessageRef = useRef(null);

  // Persist conversation locally so it survives tab switches / reloads.
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable - not critical, chat still works in-memory
    }
  }, [messages]);

  // Best-effort fetch of live suggestions; falls back silently.
  useEffect(() => {
    fetchSuggestedPrompts()
      .then((data) => {
        if (Array.isArray(data?.suggestions) && data.suggestions.length) {
          setSuggestions(data.suggestions);
        }
      })
      .catch((err) => {
        // If auth error during suggestions fetch, set auth error
        if (err?.isAuthError || err?.status === 401) {
          setAuthError(err.message);
        }
        // keep FALLBACK_SUGGESTED_PROMPTS otherwise
      });
  }, []);

  const buildHistoryPayload = useCallback((msgs) => {
    return msgs
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.isError))
      .map((m) => ({ role: m.role, content: m.content }));
  }, []);

  const dispatchMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMessage = { id: nextId(), role: 'user', content: trimmed, timestamp: Date.now() };
      const historyForApi = buildHistoryPayload(messages);

      lastFailedMessageRef.current = null;
      setAuthError(null);
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      try {
        const data = await sendChatMessage(trimmed, historyForApi);
        setLastFailedMessage(null);
        
        // Show notice if response came from fallback
        let content = data.reply;
        if (data.notice && data.source === 'local-fallback') {
          // Optionally prepend a subtle notice - but keep main content clean
          // We'll show notice in console only, not in chat bubble
          console.info('[chatbot]', data.notice, 'source:', data.source);
        }

        setMessages((curr) => [
          ...curr,
          {
            id: nextId(),
            role: 'assistant',
            content,
            timestamp: Date.now(),
            source: data.source,
          },
        ]);
      } catch (err) {
        // Handle auth errors separately
        if (err?.isAuthError || err?.status === 401) {
          setAuthError(err.message || 'Session expired. Please login again.');
          setMessages((curr) => [
            ...curr,
            {
              id: nextId(),
              role: 'assistant',
              content: `🔒 **Session expired**\n\n${err.message || 'Please login again to continue chatting.'}\n\nYour chat history is saved locally and will be restored after login.`,
              timestamp: Date.now(),
              isError: true,
              isAuthError: true,
            },
          ]);
          setIsSending(false);
          return;
        }

        lastFailedMessageRef.current = trimmed;
        setLastFailedMessage(trimmed);
        setMessages((curr) => [
          ...curr,
          {
            id: nextId(),
            role: 'assistant',
            content: err?.message || 'Something went wrong. Please try again.',
            timestamp: Date.now(),
            isError: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, buildHistoryPayload]
  );

  const retryLastMessage = useCallback(() => {
    const failed = lastFailedMessageRef.current;
    if (!failed) return;
    // drop the trailing error bubble before retrying
    setMessages((prev) => {
      const trimmedList = [...prev];
      if (trimmedList.length && trimmedList[trimmedList.length - 1].isError) trimmedList.pop();
      return trimmedList;
    });
    dispatchMessage(failed);
  }, [dispatchMessage]);

  const clearChat = useCallback(() => {
    const welcome = { ...WELCOME_MESSAGE, id: nextId(), timestamp: Date.now() };
    setMessages([welcome]);
    lastFailedMessageRef.current = null;
    setLastFailedMessage(null);
    setAuthError(null);
    try {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }, []);

  return {
    messages,
    isSending,
    suggestions,
    sendMessage: dispatchMessage,
    retryLastMessage,
    clearChat,
    canRetry: Boolean(lastFailedMessage),
    authError,
  };
}
