import { API_URLS } from '../config/app.config';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ── Save in-progress session ──────────────────────────────────────────────────
export const saveProgress = async (token, progressData) => {
  try {
    console.log('📡 Saving progress to server...', progressData.resourceType);
    const res = await fetch(`${API_URLS.BASE}/progress/save`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(progressData),
    });
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ Save progress failed:', data.message);
      throw new Error(data.message || 'Failed to save progress');
    }
    
    console.log('✅ Progress saved successfully');
    return data;
  } catch (err) {
    // Progress saving is non-critical — log but don't throw
    console.warn('⚠️ saveProgress failed (non-critical):', err.message);
    return { success: false, message: err.message };
  }
};

// ── Mark session as completed / abandoned ─────────────────────────────────────
export const completeProgress = async (token, payload) => {
  try {
    const res = await fetch(`${API_URLS.BASE}/progress/complete`, {
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
  const res = await fetch(`${API_URLS.BASE}/progress/recent`, {
    headers: headers(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch recent progress');
  return data; // { success, data: [Tracking...] }
};
