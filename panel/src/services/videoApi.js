import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = 'http://localhost:3000/api'

export const videoApi = createApi({
  reducerPath: 'videoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Video'],
  endpoints: (builder) => ({
    getAllVideos: builder.query({
      query: () => '/videos',
      providesTags: ['Video'],
    }),
    getVideoById: builder.query({
      query: (id) => `/videos/${id}`,
      providesTags: (result, error, id) => [{ type: 'Video', id }],
    }),
    createVideo: builder.mutation({
      query: (body) => ({
        url: '/videos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Video'],
    }),
    bulkCreateVideos: builder.mutation({
      query: (body) => ({
        url: '/videos/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Video'],
    }),
    updateVideo: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/videos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Video', id }, 'Video'],
    }),
    deleteVideo: builder.mutation({
      query: (id) => ({
        url: `/videos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Video'],
    }),
  }),
})

export const {
  useGetAllVideosQuery,
  useGetVideoByIdQuery,
  useCreateVideoMutation,
  useBulkCreateVideosMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
} = videoApi
