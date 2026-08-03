import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_URLS } from '../../config/app.config';

const initialState = {
  items: [],
  status: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  bulkStatus: 'idle',
  error: null,
}

export const fetchMockTests = createAsyncThunk('mockTest/fetchMockTests', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/mock`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to fetch mock tests')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const createMockTest = createAsyncThunk('mockTest/createMockTest', async (mockTest, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTest),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to create mock test')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const updateMockTest = createAsyncThunk('mockTest/updateMockTest', async ({ id, ...mockTest }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/mock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTest),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to update mock test')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const deleteMockTest = createAsyncThunk('mockTest/deleteMockTest', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/mock/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to delete mock test')
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const bulkCreateMockTests = createAsyncThunk('mockTest/bulkCreateMockTests', async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/mock/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to bulk create mock tests')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const mockTestSlice = createSlice({
  name: 'mockTest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMockTests.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMockTests.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchMockTests.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createMockTest.pending, (state) => {
        state.createStatus = 'loading'
        state.error = null
      })
      .addCase(createMockTest.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.items.unshift(action.payload)
      })
      .addCase(createMockTest.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateMockTest.pending, (state) => {
        state.updateStatus = 'loading'
        state.error = null
      })
      .addCase(updateMockTest.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.items = state.items.map((item) => (item._id === action.payload._id ? action.payload : item))
      })
      .addCase(updateMockTest.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.error = action.payload
      })
      .addCase(deleteMockTest.pending, (state) => {
        state.deleteStatus = 'loading'
        state.error = null
      })
      .addCase(deleteMockTest.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded'
        state.items = state.items.filter((item) => item._id !== action.payload)
      })
      .addCase(deleteMockTest.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.error = action.payload
      })
      .addCase(bulkCreateMockTests.pending, (state) => {
        state.bulkStatus = 'loading'
        state.error = null
      })
      .addCase(bulkCreateMockTests.fulfilled, (state, action) => {
        state.bulkStatus = 'succeeded'
        state.items = [...action.payload, ...state.items]
      })
      .addCase(bulkCreateMockTests.rejected, (state, action) => {
        state.bulkStatus = 'failed'
        state.error = action.payload
      })
  },
})

export default mockTestSlice.reducer
