import { api } from './api'

export const mockTestApi = api.injectEndpoints({
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
