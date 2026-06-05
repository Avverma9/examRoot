import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = 'http://localhost:3000/api'

export const testSeriesApi = createApi({
  reducerPath: 'testSeriesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['TestSeries'],
  endpoints: (builder) => ({
    getAllTestSeries: builder.query({
      query: () => '/test-series?includeDrafts=true&includeQuestions=true',
      providesTags: ['TestSeries'],
    }),
    createTestSeries: builder.mutation({
      query: (body) => ({
        url: '/test-series',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSeries'],
    }),
    bulkCreateTestSeries: builder.mutation({
      query: (body) => ({
        url: '/test-series/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSeries'],
    }),
    updateTestSeries: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/test-series/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TestSeries'],
    }),
    deleteTestSeries: builder.mutation({
      query: (id) => ({
        url: `/test-series/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TestSeries'],
    }),
  }),
})

export const {
  useGetAllTestSeriesQuery,
  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useDeleteTestSeriesMutation,
} = testSeriesApi
