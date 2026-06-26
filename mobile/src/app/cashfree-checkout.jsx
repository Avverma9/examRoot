/**
 * cashfree-checkout.jsx
 *
 * Opens Cashfree's hosted payment page inside a WebView.
 * Flow:
 *   1. Receives { orderId, paymentSessionId, seriesId, seriesTitle } via route params
 *   2. Loads Cashfree checkout URL in WebView
 *   3. Intercepts return_url redirect to detect payment result
 *   4. Calls POST /payment/verify/:orderId to confirm server-side
 *   5. Navigates back with result
 */

import React, { useRef, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, BackHandler
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { verifyOrder, clearCurrentOrder, fetchSubscriptions } from '../store/slices/paymentSlice'

// Cashfree hosted checkout URL template
// payment_session_id is appended as a query param
const CF_CHECKOUT_BASE = 'https://api.cashfree.com/pg/view/sessions'
const CF_SANDBOX_BASE  = 'https://sandbox.cashfree.com/pg/view/sessions'

// Deep-link scheme registered in app.json (examroot://)
const RETURN_SCHEME = 'examroot://payment'

export default function CashfreeCheckout() {
  const router   = useRouter()
  const dispatch = useDispatch()
  const params   = useLocalSearchParams()

  const { orderId, paymentSessionId, seriesId, seriesTitle, amount } = params
  const token = useSelector((s) => s.auth.token)

  const [loading,   setLoading]   = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error,     setError]     = useState('')
  const webviewRef = useRef(null)

  const isDev = __DEV__
  const checkoutUrl = `${isDev ? CF_SANDBOX_BASE : CF_CHECKOUT_BASE}?session_id=${paymentSessionId}`

  // ── Handle navigation state changes from WebView ──────────────────────────
  const handleNavChange = useCallback(
    async (navState) => {
      const url = navState.url || ''

      // Cashfree redirects to return_url after payment
      if (!url.startsWith('examroot://') && !url.startsWith('examroot%3A//')) return

      // Extract status from return URL query params
      // e.g. examroot://payment?order_id=CF_xxx&status=PAID
      const statusMatch = url.match(/[?&]status=([^&]+)/i)
      const status = statusMatch ? statusMatch[1].toUpperCase() : ''

      setVerifying(true)

      try {
        // Always verify server-side regardless of URL status param
        const result = await dispatch(verifyOrder({ orderId, token })).unwrap()

        if (result.status === 'PAID') {
          // Refresh subscriptions in redux
          dispatch(fetchSubscriptions(token))
          Alert.alert(
            '🎉 Payment Successful!',
            `Your subscription for "${seriesTitle}" is now active for 30 days.`,
            [{ text: 'Start Learning', onPress: () => router.replace({ pathname: '/test-series-detail', params: { id: seriesId } }) }]
          )
        } else {
          Alert.alert(
            'Payment Pending',
            'Payment not confirmed yet. If amount was deducted, it will be credited back in 5-7 days.',
            [{ text: 'Go Back', onPress: () => router.back() }]
          )
        }
      } catch (err) {
        Alert.alert('Error', err || 'Could not verify payment. Please contact support.', [
          { text: 'OK', onPress: () => router.back() },
        ])
      } finally {
        setVerifying(false)
        dispatch(clearCurrentOrder())
      }
    },
    [orderId, token, seriesId, seriesTitle]
  )

  const handleError = () => {
    setLoading(false)
    setError('Could not load payment page. Check your internet connection.')
  }

  const confirmCancel = () => {
    Alert.alert('Cancel Payment', 'Are you sure you want to cancel the payment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => { dispatch(clearCurrentOrder()); router.back() } },
    ])
  }

  if (!paymentSessionId) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={36} color="#EF4444" />
        <Text style={styles.errorText}>Invalid payment session. Please try again.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 44 }]}>
        <TouchableOpacity onPress={confirmCancel} style={styles.closeBtn}>
          <Feather name="x" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle} numberOfLines={1}>Pay for {seriesTitle}</Text>
          <Text style={styles.headerSub}>₹{amount} • Cashfree Secure Checkout</Text>
        </View>
        <View style={styles.secureIcon}>
          <Feather name="lock" size={16} color="#10B981" />
        </View>
      </View>

      {/* Overlay states */}
      {verifying && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.overlayText}>Verifying payment…</Text>
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(''); setLoading(true) }} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading secure payment page…</Text>
            </View>
          )}
          <WebView
            ref={webviewRef}
            source={{ uri: checkoutUrl }}
            onLoadEnd={() => setLoading(false)}
            onError={handleError}
            onNavigationStateChange={handleNavChange}
            // Also intercept URL requests for deep-link scheme
            onShouldStartLoadWithRequest={(req) => {
              if (req.url.startsWith('examroot://')) {
                handleNavChange({ url: req.url })
                return false
              }
              return true
            }}
            style={[styles.webview, loading && styles.webviewHidden]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2,
  },
  closeBtn: { padding: 6, marginRight: 10 },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  secureIcon: { padding: 6 },

  webview: { flex: 1 },
  webviewHidden: { opacity: 0, height: 0 },

  loadingWrap: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 10,
  },
  overlayText: { fontSize: 14, color: '#374151', fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center', fontWeight: '600' },
  retryBtn: { backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
