import { api } from '../store/api';

export const adminStatsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<any, void>({
      query: () => '/admin/stats',
      providesTags: ['Stats'],
    }),
    getActivity: builder.query<any, { days?: number }>({
      query: (arg) => ({
        url: '/admin/activity',
        params: { days: arg?.days || 30 },
      }),
      providesTags: ['Stats'],
    }),
    getTopContent: builder.query<any, void>({
      query: () => '/admin/top-content',
      providesTags: ['Stats'],
    }),
    getUserGrowth: builder.query<any, { days?: number }>({
      query: (arg) => ({
        url: '/admin/user-growth',
        params: { days: arg?.days || 30 },
      }),
      providesTags: ['Stats'],
    }),
    getActivityLogOverview: builder.query<any, { days?: number }>({
      query: (arg) => ({
        url: '/admin/activity-log/overview',
        params: { days: arg?.days || 30 },
      }),
      providesTags: ['Stats'],
    }),
    getCurrentActivityLog: builder.query<any, void>({
      query: () => '/admin/activity-log/current',
      providesTags: ['Stats'],
    }),
    getActivityLogSessions: builder.query<any, { days?: number; page?: number; limit?: number }>({
      query: (arg) => ({
        url: '/admin/activity-log/sessions',
        params: {
          days: arg?.days || 30,
          page: arg?.page || 1,
          limit: arg?.limit || 50,
        },
      }),
      providesTags: ['Stats'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminStatsQuery,
  useGetActivityQuery,
  useGetTopContentQuery,
  useGetUserGrowthQuery,
  useGetActivityLogOverviewQuery,
  useGetCurrentActivityLogQuery,
  useGetActivityLogSessionsQuery,
} = adminStatsApi;
