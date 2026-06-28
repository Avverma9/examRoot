import { API_BASE_URL } from '../utils/baseUrl';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ── Save in-progress session ──────────────────────────────────────────────────
export const saveProgress = async (token, progressData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/progress/save`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(progressData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save progress');
    return data;
  } catch (err) {
    // Progress saving is non-critical — log but don't throw
    console.warn('saveProgress failed (non-critical):', err.message);
    return null;
  }
};

// ── Mark session as completed / abandoned ─────────────────────────────────────
export const completeProgress = async (token, payload) => {
  try {
    const res = await fetch(`${API_BASE_URL}/progress/complete`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to complete progress');
    return data;
  } catch (err) {
    console.warn('completeProgress failed (non-critical):', err.message);
    return null;
  }
};

// ── Get recent in-progress sessions for home screen ──────────────────────────
export const getRecentProgress = async (token) => {
  const res = await fetch(`${API_BASE_URL}/progress/recent`, {
    headers: headers(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch recent progress');
  return data; // { success, data: [Tracking...] }
};
