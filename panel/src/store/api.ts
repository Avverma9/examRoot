import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const defaultBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const normalizedBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

const rawResponseHandler = async (response: Response) => {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: text,
      raw: text,
    };
  }
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: normalizedBaseUrl,
    responseHandler: rawResponseHandler,
  }),
  tagTypes: ['Stats', 'Videos', 'MockTests', 'PracticeSets', 'TestSeries', 'Banners', 'AppUpdate'],
  endpoints: () => ({}),
});

// ─── App Update Endpoints ─────────────────────────────────────────────────────
export const appUpdateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllUpdates: builder.query({
      query: () => '/app-update/admin/all',
      providesTags: ['AppUpdate'],
    }),
    createUpdate: builder.mutation({
      query: (data) => ({
        url: '/app-update/admin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AppUpdate'],
    }),
    updateUpdate: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/app-update/admin/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AppUpdate'],
    }),
    deleteUpdate: builder.mutation({
      query: (id) => ({
        url: `/app-update/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AppUpdate'],
    }),
    pushUpdate: builder.mutation({
      query: (id) => ({
        url: `/app-update/admin/${id}/push`,
        method: 'POST',
      }),
      invalidatesTags: ['AppUpdate'],
    }),
    getUsersByVersion: builder.query({
      query: () => '/app-update/admin/users-by-version',
      providesTags: ['AppUpdate'],
    }),
    getUpdateStats: builder.query({
      query: (id) => `/app-update/admin/${id}/stats`,
      providesTags: ['AppUpdate'],
    }),
  }),
});

export const {
  useGetAllUpdatesQuery,
  useCreateUpdateMutation,
  useUpdateUpdateMutation,
  useDeleteUpdateMutation,
  usePushUpdateMutation,
  useGetUsersByVersionQuery,
  useGetUpdateStatsQuery,
} = appUpdateApi;

// ─── Banner Endpoints ─────────────────────────────────────────────────────────
export const bannerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllBanners: builder.query({
      query: () => '/banners/admin/all',
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation({
      query: (data) => ({
        url: '/banners/admin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/banners/admin/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Banners'],
    }),
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/banners/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
    reorderBanners: builder.mutation({
      query: (banners) => ({
        url: '/banners/admin/reorder',
        method: 'POST',
        body: { banners },
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
});

export const {
  useGetAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useReorderBannersMutation,
} = bannerApi;

// ─── Video Endpoints ─────────────────────────────────────────────────────────
export const videoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVideos: builder.query({
      query: () => '/videos',
      providesTags: ['Videos'],
    }),
    createVideo: builder.mutation({
      query: (data) => ({
        url: '/videos',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Videos'],
    }),
    updateVideo: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/videos/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Videos'],
    }),
    deleteVideo: builder.mutation({
      query: (id) => ({
        url: `/videos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Videos'],
    }),
  }),
});

export const {
  useGetVideosQuery,
  useCreateVideoMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
} = videoApi;
