import { API_BASE_URL } from '../utils/baseUrl';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ── Toggle save/unsave a question ─────────────────────────────────────────────
export const toggleSavedQuestion = async (token, questionData) => {
  const res = await fetch(`${API_BASE_URL}/saved-questions/toggle`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(questionData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle saved question');
  return data; // { success, saved: true/false }
};

// ── Get all saved questions ───────────────────────────────────────────────────
export const getSavedQuestions = async (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/saved-questions${query ? `?${query}` : ''}`, {
    headers: headers(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch saved questions');
  return data; // { success, data: [], total }
};

// ── Get saved indices for a resource ─────────────────────────────────────────
export const getSavedStatus = async (token, resourceId) => {
  const res = await fetch(`${API_BASE_URL}/saved-questions/status/${resourceId}`, {
    headers: headers(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch saved status');
  return data; // { success, savedIndices: [0, 3, 7, ...] }
};

// ── Delete a saved question by _id ────────────────────────────────────────────
export const deleteSavedQuestion = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}/saved-questions/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete');
  return data;
};
