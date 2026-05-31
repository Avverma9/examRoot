import { api } from './api'

export const practiceSetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllPracticeSets: builder.query({
      query: () => '/practice',
      providesTags: ['PracticeSet'],
    }),
    createPracticeSet: builder.mutation({
      query: (body) => ({
        url: '/practice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PracticeSet'],
    }),
    bulkCreatePracticeSets: builder.mutation({
      query: (body) => ({
        url: '/practice/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PracticeSet'],
    }),
    updatePracticeSet: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/practice/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PracticeSet'],
    }),
    deletePracticeSet: builder.mutation({
      query: (id) => ({
        url: `/practice/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PracticeSet'],
    }),
  }),
})

export const {
  useGetAllPracticeSetsQuery,
  useCreatePracticeSetMutation,
  useBulkCreatePracticeSetsMutation,
  useUpdatePracticeSetMutation,
  useDeletePracticeSetMutation,
} = practiceSetApi
