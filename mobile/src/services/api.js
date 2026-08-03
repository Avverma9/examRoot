import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URLS } from '../config/app.config';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.BASE,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Video', 'PracticeSet', 'MockTest'],
  endpoints: () => ({}),
})
