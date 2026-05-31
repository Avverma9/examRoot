import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import videoReducer from './slices/videoSlice';
import practiceSetReducer from './slices/practiceSetSlice';
import mockTestReducer from './slices/mockTestSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    user: userReducer,
    video: videoReducer,
    practiceSet: practiceSetReducer,
    mockTest: mockTestReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
