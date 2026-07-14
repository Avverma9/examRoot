import { api } from '../store/api';

export const aiGenerateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    generateQuestions: builder.mutation<any, any>({
      query: (body) => ({
        url: '/admin/generate-questions',
        method: 'POST',
        body,
      }),
    }),
    generateMockFromSeries: builder.mutation<any, { seriesId: string; body: any }>({
      query: ({ seriesId, body }) => ({
        url: `/test-series/${seriesId}/generate-mock`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MockTests'],
    }),
    generatePracticeFromSeries: builder.mutation<any, { seriesId: string; body: any }>({
      query: ({ seriesId, body }) => ({
        url: `/test-series/${seriesId}/generate-practice`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PracticeSets'],
    }),
  }),
});

export const {
  useGenerateQuestionsMutation,
  useGenerateMockFromSeriesMutation,
  useGeneratePracticeFromSeriesMutation,
} = aiGenerateApi;
