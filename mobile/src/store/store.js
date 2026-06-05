import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import videoReducer from './slices/videoSlice';
import practiceSetReducer from './slices/practiceSetSlice';
import mockTestReducer from './slices/mockTestSlice';
import testSeriesReducer from './slices/testSeriesSlice';
import authReducer from './slices/authSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    user: userReducer,
    video: videoReducer,
    practiceSet: practiceSetReducer,
    mockTest: mockTestReducer,
    testSeries: testSeriesReducer,
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
