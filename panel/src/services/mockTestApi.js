import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BASE_URL } from '../utils/baseUrl'

export const mockTestApi = createApi({
  reducerPath: 'mockTestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['MockTest'],
  endpoints: (builder) => ({
    getAllMockTests: builder.query({
      query: () => '/mock',
      providesTags: ['MockTest'],
    }),
    createMockTest: builder.mutation({
      query: (body) => ({
        url: '/mock',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MockTest'],
    }),
    bulkCreateMockTests: builder.mutation({
      query: (body) => ({
        url: '/mock/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MockTest'],
    }),
    updateMockTest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/mock/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MockTest'],
    }),
    deleteMockTest: builder.mutation({
      query: (id) => ({
        url: `/mock/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MockTest'],
    }),
  }),
})

export const {
  useGetAllMockTestsQuery,
  useCreateMockTestMutation,
  useBulkCreateMockTestsMutation,
  useUpdateMockTestMutation,
  useDeleteMockTestMutation,
} = mockTestApi
