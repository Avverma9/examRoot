import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BASE_URL } from '../../utils/baseUrl'

const initialState = {
  items: [],
  status: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  bulkStatus: 'idle',
  error: null,
}

export const fetchVideos = createAsyncThunk('video/fetchVideos', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/videos`)
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to fetch videos')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const createVideo = createAsyncThunk('video/createVideo', async (video, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to create video')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const updateVideo = createAsyncThunk('video/updateVideo', async ({ id, ...video }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to update video')
    return data?.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const deleteVideo = createAsyncThunk('video/deleteVideo', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/videos/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to delete video')
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const bulkCreateVideos = createAsyncThunk('video/bulkCreateVideos', async (videos, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BASE_URL}/videos/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videos),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.message || 'Failed to bulk create videos')
    return data?.data || []
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createVideo.pending, (state) => {
        state.createStatus = 'loading'
        state.error = null
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.items.unshift(action.payload)
      })
      .addCase(createVideo.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateVideo.pending, (state) => {
        state.updateStatus = 'loading'
        state.error = null
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.items = state.items.map((item) => (item._id === action.payload._id ? action.payload : item))
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.error = action.payload
      })
      .addCase(deleteVideo.pending, (state) => {
        state.deleteStatus = 'loading'
        state.error = null
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded'
        state.items = state.items.filter((item) => item._id !== action.payload)
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.error = action.payload
      })
      .addCase(bulkCreateVideos.pending, (state) => {
        state.bulkStatus = 'loading'
        state.error = null
      })
      .addCase(bulkCreateVideos.fulfilled, (state, action) => {
        state.bulkStatus = 'succeeded'
        state.items = [...action.payload, ...state.items]
      })
      .addCase(bulkCreateVideos.rejected, (state, action) => {
        state.bulkStatus = 'failed'
        state.error = action.payload
      })
  },
})

export default videoSlice.reducer
