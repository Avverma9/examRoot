import { API_URLS } from '../config/app.config';

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || fallbackMessage);
    return data;
  }

  const text = await response.text();
  const shortText = text.replace(/\s+/g, ' ').trim().slice(0, 120);
  const serverMessage = response.status >= 500
    ? 'Backend server is not responding. Please try again in a moment.'
    : fallbackMessage;

  throw new Error(shortText ? `${serverMessage} (${response.status}: ${shortText})` : serverMessage);
};

export const requestOTP = async ({ email }) => {
  const response = await fetch(`${API_URLS.BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseApiResponse(response, 'Failed to send OTP');
};

export const resendOTP = async ({ email }) => {
  const response = await fetch(`${API_URLS.BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseApiResponse(response, 'Failed to resend OTP');
};

export const verifyOTPAndLogin = async ({ email, otp, name }) => {
  const payload = { email, otp };
  if (name) payload.name = name;

  const response = await fetch(`${API_URLS.BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseApiResponse(response, 'Failed to verify OTP');
};

export const googleLoginApi = async (idToken) => {
  const response = await fetch(`${API_URLS.BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return parseApiResponse(response, 'Google login failed');
};

export const passwordLogin = async ({ email, password, name }) => {
  const response = await fetch(`${API_URLS.BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return parseApiResponse(response, 'Login failed');
};

export const updatePassword = async (token, { currentPassword, newPassword }) => {
  const payload = { newPassword };
  if (currentPassword) {
    payload.currentPassword = currentPassword;
  }

  const response = await fetch(`${API_URLS.BASE}/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return parseApiResponse(response, 'Failed to update password');
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_URLS.BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Failed to get user');
};

export const updateProfile = async (token, updates) => {
  const response = await fetch(`${API_URLS.BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return parseApiResponse(response, 'Failed to update profile');
};
