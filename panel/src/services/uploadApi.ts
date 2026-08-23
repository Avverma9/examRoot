import { api } from '../store/api';

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPresignedUrl: builder.mutation<any, { type: string; filename: string; contentType: string }>({
      query: (body) => ({
        url: '/upload/presign',
        method: 'POST',
        body,
      }),
    }),
    uploadSeriesIcon: builder.mutation<any, FormData>({
      query: (body) => ({ url: '/upload/series-icon', method: 'POST', body }),
    }),
    deleteUpload: builder.mutation<any, { url: string }>({
      query: (body) => ({
        url: '/upload',
        method: 'DELETE',
        body,
      }),
    }),
  }),
});

export const {
  useGetPresignedUrlMutation,
  useUploadSeriesIconMutation,
  useDeleteUploadMutation,
} = uploadApi;
