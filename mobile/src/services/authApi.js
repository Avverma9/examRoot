import { API_BASE_URL } from '../utils/baseUrl';

// ─── Request OTP ──────────────────────────────────────────────────────────────
export const requestOTP = async ({ email, phone }) => {
  const body = email ? { email } : { phone };
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOTP = async ({ email, phone }) => {
  const body = email ? { email } : { phone };
  const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
  return data;
};

// ─── Verify OTP & Login ───────────────────────────────────────────────────────
export const verifyOTPAndLogin = async ({ email, phone, otp, name }) => {
  const payload = { otp };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (name)  payload.name  = name;

  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to verify OTP');
  return data;
};

// ─── Google Login ─────────────────────────────────────────────────────────────
export const googleLoginApi = async (idToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Google login failed');
  return data; // { success, token, user }
};

// ─── Get current user ─────────────────────────────────────────────────────────
export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get user');
  return data;
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (token, updates) => {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update profile');
  return data;
};
