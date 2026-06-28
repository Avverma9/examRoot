import { configureStore } from '@reduxjs/toolkit'
import { api } from '../services/api'
import { videoApi } from '../services/videoApi'
import { practiceSetApi } from '../services/practiceSetApi'
import { mockTestApi } from '../services/mockTestApi'
import { testSeriesApi } from '../services/testSeriesApi'
import { bannerApi } from '../services/bannerApi'
import { adminApi } from '../services/adminApi'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [practiceSetApi.reducerPath]: practiceSetApi.reducer,
    [mockTestApi.reducerPath]: mockTestApi.reducer,
    [testSeriesApi.reducerPath]: testSeriesApi.reducer,
    [bannerApi.reducerPath]: bannerApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      api.middleware,
      videoApi.middleware,
      practiceSetApi.middleware,
      mockTestApi.middleware,
      testSeriesApi.middleware,
      bannerApi.middleware,
      adminApi.middleware,
    ),
})
