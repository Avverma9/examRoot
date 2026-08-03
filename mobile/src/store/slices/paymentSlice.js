import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_URLS } from '../../config/app.config';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Create Cashfree order → returns { orderId, paymentSessionId, orderAmount } */
export const createOrder = createAsyncThunk(
  'payment/createOrder',
  async ({ seriesId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URLS.BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seriesId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to create order')
      return data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

/** Poll server to confirm payment after WebView redirect */
export const verifyOrder = createAsyncThunk(
  'payment/verifyOrder',
  async ({ orderId, token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URLS.BASE}/payment/verify/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to verify order')
      return data  // { status: 'PAID' | 'ACTIVE' | ... }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

/** Fetch all subscriptions for current user */
export const fetchSubscriptions = createAsyncThunk(
  'payment/fetchSubscriptions',
  async (token, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URLS.BASE}/payment/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch subscriptions')
      return data.data || []
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    // Current order being processed
    currentOrder: null,       // { orderId, paymentSessionId, orderAmount, seriesTitle }
    orderStatus: 'idle',      // 'idle' | 'loading' | 'succeeded' | 'failed'

    // Post-payment verification
    verifyStatus: 'idle',     // 'idle' | 'loading' | 'paid' | 'pending' | 'failed'

    // User's subscriptions list
    subscriptions: [],
    subscriptionsStatus: 'idle',

    error: null,
  },
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder  = null
      state.orderStatus   = 'idle'
      state.verifyStatus  = 'idle'
      state.error         = null
    },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    // createOrder
    builder
      .addCase(createOrder.pending,   (s) => { s.orderStatus = 'loading'; s.error = null })
      .addCase(createOrder.fulfilled, (s, a) => { s.orderStatus = 'succeeded'; s.currentOrder = a.payload })
      .addCase(createOrder.rejected,  (s, a) => { s.orderStatus = 'failed'; s.error = a.payload })

    // verifyOrder
    builder
      .addCase(verifyOrder.pending,   (s) => { s.verifyStatus = 'loading' })
      .addCase(verifyOrder.fulfilled, (s, a) => {
        s.verifyStatus = a.payload.status === 'PAID' ? 'paid' : 'pending'
      })
      .addCase(verifyOrder.rejected,  (s, a) => { s.verifyStatus = 'failed'; s.error = a.payload })

    // fetchSubscriptions
    builder
      .addCase(fetchSubscriptions.pending,   (s) => { s.subscriptionsStatus = 'loading' })
      .addCase(fetchSubscriptions.fulfilled, (s, a) => { s.subscriptionsStatus = 'succeeded'; s.subscriptions = a.payload })
      .addCase(fetchSubscriptions.rejected,  (s, a) => { s.subscriptionsStatus = 'failed'; s.error = a.payload })
  },
})

export const { clearCurrentOrder, clearError } = paymentSlice.actions
export default paymentSlice.reducer
