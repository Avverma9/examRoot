import { api } from './api'

export const videoApi = api.injectEndpoints({
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
