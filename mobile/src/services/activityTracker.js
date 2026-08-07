import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URLS } from '../config/app.config';

const DEVICE_ID_KEY = '@examroot_device_id';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
};

export const getOrCreateDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const buildActivityMeta = async () => {
  const deviceId = await getOrCreateDeviceId();
  const timeZone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '';
  const locale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale || '';
  const appVersion = safeText(Constants.expoConfig?.version || Constants.nativeAppVersion || '1.0.0');
  const buildVersion = safeText(Constants.nativeBuildVersion || '');
  const deviceLabel = safeText(Device.modelName || Device.brand || Platform.OS || 'mobile');

  return {
    deviceId,
    deviceLabel,
    platform: Platform.OS,
    osVersion: safeText(Device.osVersion || ''),
    appVersion,
    buildVersion,
    locale,
    timeZone,
    metadata: {
      brand: safeText(Device.brand || ''),
      manufacturer: safeText(Device.manufacturer || ''),
      osName: safeText(Device.osName || ''),
      deviceYearClass: Device.deviceYearClass || null,
      appOwnership: safeText(Constants.appOwnership || ''),
    },
  };
};

const post = async (path, token, body) => {
  try {
    const res = await fetch(`${API_URLS.ROOT}${path}`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn('Activity tracking responded with non-OK status', res.status, data);
      return { success: false, status: res.status, message: data?.message || 'Activity tracking failed' };
    }
    return data;
  } catch (err) {
    console.warn('Activity tracking network error:', err?.message || err);
    return { success: false, message: err?.message || 'Network error' };
  }
};

export const startAppActivitySession = async (token, sessionId) => {
  if (!token) return null;
  const meta = await buildActivityMeta();
  return post('/tracking/app/start', token, {
    sessionId,
    ...meta,
  });
};

export const heartbeatAppActivitySession = async (token, sessionId) => {
  if (!token) return null;
  const meta = await buildActivityMeta();
  return post('/tracking/app/heartbeat', token, {
    sessionId,
    ...meta,
  });
};

export const endAppActivitySession = async (token, sessionId, reason = 'manual') => {
  if (!token) return null;
  const meta = await buildActivityMeta();
  return post('/tracking/app/end', token, {
    sessionId,
    reason,
    ...meta,
  });
};
