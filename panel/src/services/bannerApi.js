import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = 'http://localhost:3000/api'

export const bannerApi = createApi({
  reducerPath: 'bannerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Banner'],
  endpoints: (builder) => ({
    getAllBannersAdmin: builder.query({
      query: () => '/banners/admin/all',
      providesTags: ['Banner'],
    }),
    createBanner: builder.mutation({
      query: (body) => ({
        url: '/banners/admin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/banners/admin/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/banners/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banner'],
    }),
    getBannerPresignedUrl: builder.mutation({
      query: (body) => ({
        url: '/banners/admin/presign',
        method: 'POST',
        body,
      }),
    }),
    reorderBanners: builder.mutation({
      query: (body) => ({
        url: '/banners/admin/reorder',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banner'],
    }),
  }),
})

export const {
  useGetAllBannersAdminQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetBannerPresignedUrlMutation,
  useReorderBannersMutation,
} = bannerApi
