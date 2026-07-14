import { api } from '../store/api';

export const videosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVideos: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/videos',
        params,
      }),
      providesTags: ['Videos'],
    }),
    createVideo: builder.mutation<any, any>({
      query: (body) => ({
        url: '/videos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Videos'],
    }),
    updateVideo: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/videos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Videos'],
    }),
    deleteVideo: builder.mutation<any, string>({
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
} = videosApi;
