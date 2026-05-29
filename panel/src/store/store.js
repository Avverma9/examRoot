import { configureStore } from '@reduxjs/toolkit'
import { api } from '../services/api'
import { videoApi } from '../services/videoApi'
import { practiceSetApi } from '../services/practiceSetApi'
import { mockTestApi } from '../services/mockTestApi'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [practiceSetApi.reducerPath]: practiceSetApi.reducer,
    [mockTestApi.reducerPath]: mockTestApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      api.middleware,
      videoApi.middleware,
      practiceSetApi.middleware,
      mockTestApi.middleware
    ),
})
