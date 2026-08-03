import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import videoReducer from './slices/videoSlice';
import practiceSetReducer from './slices/practiceSetSlice';
import mockTestReducer from './slices/mockTestSlice';
import testSeriesReducer from './slices/testSeriesSlice';
import authReducer from './slices/authSlice';
import paymentReducer from './slices/paymentSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    user: userReducer,
    video: videoReducer,
    practiceSet: practiceSetReducer,
    mockTest: mockTestReducer,
    testSeries: testSeriesReducer,
    auth: authReducer,
    payment: paymentReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
});
