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
  tagTypes: ['TestSeries', 'MockTest', 'PracticeSet'],
  endpoints: (builder) => ({
    getAllTestSeries: builder.query({
      query: () => '/test-series?includeDrafts=true&includeQuestions=true',
      providesTags: ['TestSeries'],
    }),
    getTestsMeta: builder.query({
      query: (id) => `/test-series/${id}/tests-meta`,
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
    // ─── Generate endpoints ───────────────────────────────────────────────────
    generateMockTest: builder.mutation({
      query: ({ seriesId, ...body }) => ({
        url: `/test-series/${seriesId}/generate-mock`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MockTest'],
    }),
    generatePracticeSet: builder.mutation({
      query: ({ seriesId, ...body }) => ({
        url: `/test-series/${seriesId}/generate-practice`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PracticeSet'],
    }),
  }),
})

export const {
  useGetAllTestSeriesQuery,
  useGetTestsMetaQuery,
  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useDeleteTestSeriesMutation,
  useGenerateMockTestMutation,
  useGeneratePracticeSetMutation,
} = testSeriesApi
