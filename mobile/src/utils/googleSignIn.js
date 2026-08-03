import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GOOGLE_AUTH } from '../config/app.config';

// NOTE: maybeCompleteAuthSession() is called in oauth2redirect.jsx screen
// DO NOT call it here - it must be called in the redirect screen

// Safely extract functions with fallbacks
const makeRedirectUri = AuthSession?.makeRedirectUri || (() => {
  console.warn('makeRedirectUri not available');
  return 'examroot://oauth2redirect';
});
const exchangeCodeAsync = AuthSession?.exchangeCodeAsync || (async () => {
  throw new Error('exchangeCodeAsync not available');
});
const loadAsync = AuthSession?.loadAsync;
const ResponseType = AuthSession?.ResponseType || { Code: 'code' };

// NOTE: maybeCompleteAuthSession() is called in oauth2redirect.jsx screen
// DO NOT call it here - it must be called in the redirect screen

// Google OAuth 2.0 endpoints (static discovery - faster than .well-known lookup)
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint:         'https://oauth2.googleapis.com/token',
  revocationEndpoint:    'https://oauth2.googleapis.com/revoke',
};

// ── Client IDs (from app.json) ────────────────────────────────────────────────
const WEB_CLIENT_ID = GOOGLE_AUTH.WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = GOOGLE_AUTH.ANDROID_CLIENT_ID;

// ── Redirect URI ──────────────────────────────────────────────────────────────
// Android → native com.googleusercontent scheme
// Web     → expo scheme
const getRedirectUri = () => {
  if (Platform.OS === 'android' && ANDROID_CLIENT_ID) {
    const clientPrefix = ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '');
    return makeRedirectUri({
      native: `com.googleusercontent.apps.${clientPrefix}:/oauth2redirect`,
    });
  }
  return makeRedirectUri({ scheme: 'examroot', path: 'oauth2redirect' });
};

// Status codes for error handling
export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export const isGoogleSignInAvailable = true;

export const configureGoogleSignIn = async (clientId) => {
  if (!clientId) {
    throw new Error('Google Client ID is required.');
  }
  await AsyncStorage.setItem('@google_client_id', clientId);
};

export const signInWithGoogle = async () => {
  try {
    // Pick correct client ID for platform
    const clientId = Platform.OS === 'android'
      ? ANDROID_CLIENT_ID
      : WEB_CLIENT_ID;

    if (!clientId) {
      throw new Error('Google Client ID not set in app config.');
    }

    const redirectUri = getRedirectUri();

    console.log('Platform     :', Platform.OS);
    console.log('Client ID    :', clientId);
    console.log('Redirect URI :', redirectUri);

    const request = await loadAsync({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
    }, discovery);

    const result = await request.promptAsync(discovery, {
      showInRecents: true,
    });

    console.log('Result type:', result.type);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      const err = new Error('User cancelled Google sign-in');
      err.code = statusCodes.SIGN_IN_CANCELLED;
      throw err;
    }

    if (result.type === 'error') {
      const msg = result.params?.error_description || result.error?.message || 'Google auth failed';
      const err = new Error(msg);
      err.code  = result.params?.error || 'AUTH_ERROR';
      throw err;
    }

    if (result.type === 'success') {
      try {
        WebBrowser.dismissBrowser();
      } catch (_) {}
      console.log('Auth success! Params keys:', Object.keys(result.params));
      const { code, id_token, access_token } = result.params;

      // id_token directly available
      if (id_token) {
        console.log('Got id_token directly ✅');
        return { idToken: id_token, accessToken: access_token };
      }

      // Exchange authorization code for tokens
      if (code) {
        console.log('Exchanging auth code for tokens...');
        const tokenResult = await exchangeCodeAsync(
          {
            clientId,
            redirectUri,
            code,
            extraParams: { code_verifier: request.codeVerifier },
          },
          discovery,
        );
        console.log('Token exchange done ✅');
        const idToken = tokenResult.idToken || tokenResult.id_token;
        if (!idToken) throw new Error('No ID token after code exchange');
        return { idToken, accessToken: tokenResult.accessToken };
      }

      throw new Error('No id_token or code in Google response');
    }

    throw new Error('Unexpected Google auth response');
  } catch (error) {
    if (error.code) throw error;
    const wrapped      = new Error(error.message || 'Google Sign-In failed');
    wrapped.originalError = error;
    throw wrapped;
  }
};

export const signOutGoogle = async () => {
  try {
    await AsyncStorage.removeItem('@google_auth_token');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
};
