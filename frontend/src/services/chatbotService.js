import { apiBaseUrl } from '../utils/api';

const getToken = () => localStorage.getItem('operator_token') || localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
    const error = new Error(data?.message || 'Failed to reach the chatbot service.');
    error.status = response.status;
    throw error;
  }

  return data; // { reply, timestamp }
};

export const fetchSuggestedPrompts = async () => {
  const response = await fetch(`${apiBaseUrl}/api/chatbot/suggestions`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to load suggestions.');
  return response.json(); // { suggestions }
};

export default { sendChatMessage, fetchSuggestedPrompts };
