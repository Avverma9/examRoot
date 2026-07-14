import { api } from '../store/api';

export const practiceSetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPracticeSets: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/practice',
        params,
      }),
      providesTags: ['PracticeSets'],
    }),
    createPracticeSet: builder.mutation<any, any>({
      query: (body) => ({
        url: '/practice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PracticeSets'],
    }),
    updatePracticeSet: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/practice/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PracticeSets'],
    }),
    deletePracticeSet: builder.mutation<any, string>({
      query: (id) => ({
        url: `/practice/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PracticeSets'],
    }),
  }),
});

export const {
  useGetPracticeSetsQuery,
  useCreatePracticeSetMutation,
  useUpdatePracticeSetMutation,
  useDeletePracticeSetMutation,
} = practiceSetsApi;
