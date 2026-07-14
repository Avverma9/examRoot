import { api } from '../store/api';

export const bannersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBanners: builder.query<any, void>({
      query: () => '/banners/admin/all',
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation<any, any>({
      query: (body) => ({
        url: '/banners/admin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/banners/admin/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
    deleteBanner: builder.mutation<any, string>({
      query: (id) => ({
        url: `/banners/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
    reorderBanners: builder.mutation<any, any>({
      query: (body) => ({
        url: '/banners/admin/reorder',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
});

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useReorderBannersMutation,
} = bannersApi;
