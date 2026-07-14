import { api } from '../store/api';

export const mockTestsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMockTests: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/mock',
        params,
      }),
      providesTags: ['MockTests'],
    }),
    createMockTest: builder.mutation<any, any>({
      query: (body) => ({
        url: '/mock',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MockTests'],
    }),
    updateMockTest: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/mock/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MockTests'],
    }),
    deleteMockTest: builder.mutation<any, string>({
      query: (id) => ({
        url: `/mock/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MockTests'],
    }),
  }),
});

export const {
  useGetMockTestsQuery,
  useCreateMockTestMutation,
  useUpdateMockTestMutation,
  useDeleteMockTestMutation,
} = mockTestsApi;
