import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Login Success
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    // Login Failure
    loginFailure: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },

    // Set User
    setUser: (state, action) => {
      state.user = action.payload;
    },

    // Set Token
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
      }
    },

    // Clear Error
    clearError: (state) => {
      state.error = null;
    },

    // Set Error
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Initialize Auth (from storage)
    initializeAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  setToken,
  clearError,
  setError,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;
