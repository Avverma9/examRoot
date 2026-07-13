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
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: ['TestSeries', 'MockTest', 'PracticeSet'],
  endpoints: (builder) => ({
    getAllTestSeries: builder.query({
      query: ({ page = 1, limit = 20, search = '', mode = 'summary' } = {}) => {
        const params = new URLSearchParams()
        params.set('includeDrafts', 'true')
        params.set('mode', mode)
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (search?.trim()) params.set('search', search.trim())
        return `/test-series?${params.toString()}`
      },
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
    updateTestSeriesTestMeta: builder.mutation({
      query: ({ seriesId, testId, ...body }) => ({
        url: `/test-series/${seriesId}/tests/${testId}/meta`,
        method: 'PATCH',
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
  useLazyGetTestsMetaQuery,
  useLazyGetTestSeriesByIdQuery,  useCreateTestSeriesMutation,
  useBulkCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useUpdateTestSeriesTestMetaMutation,
  useDeleteTestSeriesMutation,
  useGenerateMockTestMutation,
  useGeneratePracticeSetMutation,
  useGetThumbnailPresignedUrlMutation,
  useSaveSeriesThumbnailMutation,
  useDeleteSeriesThumbnailMutation,
} = testSeriesApi
