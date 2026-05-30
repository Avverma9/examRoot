import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    // Future me aur slices yahan add kar sakte hain jaise:
    // mockTests: mockTestReducer,
  },
});