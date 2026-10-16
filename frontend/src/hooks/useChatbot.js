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
      .catch(() => {
        // keep FALLBACK_SUGGESTED_PROMPTS
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
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);

      try {
        const data = await sendChatMessage(trimmed, historyForApi);
        setLastFailedMessage(null);
        setMessages((curr) => [
          ...curr,
          {
            id: nextId(),
            role: 'assistant',
            content: data.reply,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
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
  };
}