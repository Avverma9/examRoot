import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://backend.examroot.cc/api';
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const normalizedBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: normalizedBaseUrl,
  }),
  tagTypes: ['Stats', 'Videos', 'MockTests', 'PracticeSets', 'TestSeries', 'Banners'],
  endpoints: () => ({}),
});
