import { api } from '../store/api';

export const testSeriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTestSeries: builder.query<any, { page?: number; limit?: number; search?: string; includeDrafts?: boolean; mode?: string }>({
      query: (params) => ({
        url: '/test-series',
        params,
      }),
      providesTags: ['TestSeries'],
    }),
    getTestSeriesById: builder.query<any, string>({
      query: (id) => `/test-series/${id}?includeQuestions=false`,
      providesTags: (result, error, id) => [{ type: 'TestSeries', id }],
    }),
    getTestSeriesMeta: builder.query<any, string>({
      query: (id) => `/test-series/${id}/tests-meta`,
      providesTags: (result, error, id) => [{ type: 'TestSeries', id }],
    }),
    createTestSeries: builder.mutation<any, any>({
      query: (body) => ({
        url: '/test-series',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSeries'],
    }),
    updateTestSeries: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/test-series/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TestSeries', id }, 'TestSeries'],
    }),
    addSeriesTests: builder.mutation<any, { seriesId: string; tests: any[] }>({
      query: ({ seriesId, tests }) => ({
        url: `/test-series/${seriesId}/tests/bulk`,
        method: 'POST',
        body: { tests },
      }),
      invalidatesTags: (result, error, { seriesId }) => [{ type: 'TestSeries', id: seriesId }, 'TestSeries'],
    }),
    patchTestMeta: builder.mutation<any, { seriesId: string; testId: string; body: any }>({
      query: ({ seriesId, testId, body }) => ({
        url: `/test-series/${seriesId}/tests/${testId}/meta`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { seriesId }) => [{ type: 'TestSeries', id: seriesId }, 'TestSeries'],
    }),
    updateTestQuestions: builder.mutation<any, { seriesId: string; testId: string; questions: any[] }>({
      query: ({ seriesId, testId, questions }) => ({
        url: `/test-series/${seriesId}/tests/${testId}/questions`,
        method: 'PATCH',
        body: { questions },
      }),
      invalidatesTags: (result, error, { seriesId }) => [{ type: 'TestSeries', id: seriesId }, 'TestSeries'],
    }),
    deleteTest: builder.mutation<any, { seriesId: string; testId: string }>({
      query: ({ seriesId, testId }) => ({
        url: `/test-series/${seriesId}/tests/${testId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { seriesId }) => [{ type: 'TestSeries', id: seriesId }, 'TestSeries'],
    }),
    deleteTestSeries: builder.mutation<any, string>({
      query: (id) => ({
        url: `/test-series/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TestSeries'],
    }),
  }),
});

export const {
  useGetTestSeriesQuery,
  useGetTestSeriesByIdQuery,
  useGetTestSeriesMetaQuery,
  useCreateTestSeriesMutation,
  useUpdateTestSeriesMutation,
  useAddSeriesTestsMutation,
  usePatchTestMetaMutation,
  useUpdateTestQuestionsMutation,
  useDeleteTestMutation,
  useDeleteTestSeriesMutation,
} = testSeriesApi;
