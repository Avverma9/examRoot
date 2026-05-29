import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = 'http://localhost:3000/api'

export const practiceSetApi = createApi({
  reducerPath: 'practiceSetApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['PracticeSet'],
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
