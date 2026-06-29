import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BASE_URL } from '../utils/baseUrl'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['AdminStats'],
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    getDailyActivity: builder.query({
      query: (days = 30) => `/admin/activity?days=${days}`,
    }),
    getTopContent: builder.query({
      query: () => '/admin/top-content',
    }),
    getUserGrowth: builder.query({
      query: (days = 30) => `/admin/user-growth?days=${days}`,
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetDailyActivityQuery,
  useGetTopContentQuery,
  useGetUserGrowthQuery,
} = adminApi
