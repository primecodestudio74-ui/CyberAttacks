import { apiBaseUrl } from '../utils/api';

const getToken = () => localStorage.getItem('operator_token') || localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleAuthError = (status, code) => {
  if (status === 401) {
    // Clear expired session and redirect to login
    const isAuthError = ['MISSING_TOKEN', 'INVALID_TOKEN', 'USER_NOT_FOUND', 'INVALID_TOKEN_PAYLOAD', 'AUTH_FAILED'].includes(code) || !code;
    if (isAuthError) {
      try {
        localStorage.removeItem('operator_token');
        localStorage.removeItem('token');
        localStorage.removeItem('operator_name');
      } catch {
        /* ignore */
      }
      // Don't redirect immediately if we're in chatbot - let hook handle it
      // But set a flag so UI can show session expired
      const err = new Error('Your session has expired. Please login again.');
      err.status = 401;
      err.code = code || 'SESSION_EXPIRED';
      err.isAuthError = true;
      throw err;
    }
  }
};

/**
 * Send a message + prior turns to the backend chatbot endpoint.
 * @param {string} message
 * @param {{role: 'user'|'assistant', content: string}[]} history
 */
export const sendChatMessage = async (message, history) => {
  const response = await fetch(`${apiBaseUrl}/api/chatbot/message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle auth errors specially
    if (response.status === 401) {
      handleAuthError(response.status, data?.code);
    }

    // Map backend error codes to user-friendly messages
    let friendlyMessage = data?.message || 'Failed to reach the chatbot service.';

    // Never show raw "User not found" to user - map to friendly message
    if (friendlyMessage.toLowerCase().includes('user not found')) {
      if (response.status === 401) {
        friendlyMessage = 'Your session has expired. Please login again.';
      } else {
        friendlyMessage = 'Chatbot is temporarily unavailable. Please try again in a moment.';
      }
    }

    // Handle rate limit
    if (response.status === 429) {
      friendlyMessage = data?.message || 'Too many requests. Please wait a minute and try again.';
    }

    // Handle offline mode messages
    if (response.status === 503 && data?.code) {
      friendlyMessage = data?.message || 'Chatbot is in offline mode. You can still get answers to common topics.';
    }

    const error = new Error(friendlyMessage);
    error.status = response.status;
    error.code = data?.code;
    error.isAuthError = response.status === 401;
    throw error;
  }

  return data; // { reply, timestamp, source }
};

export const fetchSuggestedPrompts = async () => {
  const response = await fetch(`${apiBaseUrl}/api/chatbot/suggestions`, {
    headers: authHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError(response.status, data?.code);
    }
    throw new Error(data?.message || 'Failed to load suggestions.');
  }
  return data; // { suggestions }
};

export default { sendChatMessage, fetchSuggestedPrompts };
