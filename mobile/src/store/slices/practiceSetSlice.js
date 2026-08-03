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

export const fetchPracticeSets = createAsyncThunk('practiceSet/fetchPracticeSets', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/practice`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to fetch practice sets')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const createPracticeSet = createAsyncThunk('practiceSet/createPracticeSet', async (practiceSet, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(practiceSet),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to create practice set')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const updatePracticeSet = createAsyncThunk('practiceSet/updatePracticeSet', async ({ id, ...practiceSet }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/practice/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(practiceSet),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to update practice set')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const deletePracticeSet = createAsyncThunk('practiceSet/deletePracticeSet', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/practice/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to delete practice set')
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const bulkCreatePracticeSets = createAsyncThunk('practiceSet/bulkCreatePracticeSets', async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URLS.BASE}/practice/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to bulk create practice sets')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const practiceSetSlice = createSlice({
  name: 'practiceSet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPracticeSets.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPracticeSets.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchPracticeSets.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createPracticeSet.pending, (state) => {
        state.createStatus = 'loading'
        state.error = null
      })
      .addCase(createPracticeSet.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.items.unshift(action.payload)
      })
      .addCase(createPracticeSet.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updatePracticeSet.pending, (state) => {
        state.updateStatus = 'loading'
        state.error = null
      })
      .addCase(updatePracticeSet.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.items = state.items.map((item) => (item._id === action.payload._id ? action.payload : item))
      })
      .addCase(updatePracticeSet.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.error = action.payload
      })
      .addCase(deletePracticeSet.pending, (state) => {
        state.deleteStatus = 'loading'
        state.error = null
      })
      .addCase(deletePracticeSet.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded'
        state.items = state.items.filter((item) => item._id !== action.payload)
      })
      .addCase(deletePracticeSet.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.error = action.payload
      })
      .addCase(bulkCreatePracticeSets.pending, (state) => {
        state.bulkStatus = 'loading'
        state.error = null
      })
      .addCase(bulkCreatePracticeSets.fulfilled, (state, action) => {
        state.bulkStatus = 'succeeded'
        state.items = [...action.payload, ...state.items]
      })
      .addCase(bulkCreatePracticeSets.rejected, (state, action) => {
        state.bulkStatus = 'failed'
        state.error = action.payload
      })
  },
})

export default practiceSetSlice.reducer
