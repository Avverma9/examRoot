import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BASE_URL } from '../utils/baseUrl'

const safeResponseHandler = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { success: false, message: text, raw: text }
  }
}

export const testSeriesApi = createApi({
  reducerPath: 'testSeriesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    responseHandler: safeResponseHandler,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['TestSeries', 'MockTest', 'PracticeSet'],
  endpoints: (builder) => ({
    getAllTestSeries: builder.query({
      query: () => '/test-series?includeDrafts=true',
      providesTags: ['TestSeries'],
    }),
    getTestsMeta: builder.query({
      query: (id) => `/test-series/${id}/tests-meta`,
    }),
    getTestSeriesById: builder.query({
      query: (id) => `/test-series/${id}?includeQuestions=true`,
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
    getThumbnailPresignedUrl: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/test-series/${id}/thumbnail-presign`,
        method: 'POST',
        body,
      }),
    }),
    saveSeriesThumbnail: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/test-series/${id}/thumbnail`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TestSeries'],
    }),
    deleteSeriesThumbnail: builder.mutation({
      query: (id) => ({
        url: `/test-series/${id}/thumbnail`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TestSeries'],
    }),
  }),
})

export const {
  useGetAllTestSeriesQuery,
  useGetTestsMetaQuery,  useGetTestSeriesByIdQuery,
  useLazyGetTestSeriesByIdQuery,  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useDeleteTestSeriesMutation,
  useGenerateMockTestMutation,
  useGeneratePracticeSetMutation,
  useGetThumbnailPresignedUrlMutation,
  useSaveSeriesThumbnailMutation,
  useDeleteSeriesThumbnailMutation,
} = testSeriesApi
