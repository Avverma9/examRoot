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
    autoGenerateMcqFromPdf: builder.mutation<any, { seriesId: string; file: File }>(
      {
        query: ({ seriesId, file }) => {
          const formData = new FormData();
          formData.append('seriesId', seriesId);
          formData.append('file', file);

          return {
            url: '/mcq-auto-generate',
            method: 'POST',
            body: formData,
          };
        },
        invalidatesTags: ['TestSeries'],
      }
    ),
  }),
});

export const {
  useGenerateQuestionsMutation,
  useGenerateMockFromSeriesMutation,
  useGeneratePracticeFromSeriesMutation,
  useAutoGenerateMcqFromPdfMutation,
} = aiGenerateApi;
