import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BASE_URL } from '../../utils/baseUrl'

const initialState = {
  items: [],
  selectedSeries: null,
  selectedTest: null,
  status: 'idle',
  seriesStatus: 'idle',
  testStatus: 'idle',
  error: null,
}

export const fetchTestSeries = createAsyncThunk('testSeries/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${BASE_URL}/test-series${query ? `?${query}` : ''}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const fetchTestSeriesById = createAsyncThunk('testSeries/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await fetch(`${BASE_URL}/test-series/${id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const fetchTestById = createAsyncThunk('testSeries/fetchTest', async ({ seriesId, testId }, { rejectWithValue }) => {
  try {
    const res = await fetch(`${BASE_URL}/test-series/${seriesId}/test/${testId}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Failed to fetch test')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const testSeriesSlice = createSlice({
  name: 'testSeries',
  initialState,
  reducers: {
    clearSelectedTest: (state) => { state.selectedTest = null; state.testStatus = 'idle' },
    clearSelectedSeries: (state) => { state.selectedSeries = null; state.seriesStatus = 'idle' },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestSeries.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(fetchTestSeries.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchTestSeries.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })

      .addCase(fetchTestSeriesById.pending, (state) => { state.seriesStatus = 'loading' })
      .addCase(fetchTestSeriesById.fulfilled, (state, action) => { state.seriesStatus = 'succeeded'; state.selectedSeries = action.payload })
      .addCase(fetchTestSeriesById.rejected, (state, action) => { state.seriesStatus = 'failed'; state.error = action.payload })

      .addCase(fetchTestById.pending, (state) => { state.testStatus = 'loading' })
      .addCase(fetchTestById.fulfilled, (state, action) => { state.testStatus = 'succeeded'; state.selectedTest = action.payload })
      .addCase(fetchTestById.rejected, (state, action) => { state.testStatus = 'failed'; state.error = action.payload })
  },
})

export const { clearSelectedTest, clearSelectedSeries } = testSeriesSlice.actions
export default testSeriesSlice.reducer
