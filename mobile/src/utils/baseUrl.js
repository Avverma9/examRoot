import { Platform } from 'react-native'
import Constants from 'expo-constants'

const LOCAL_BASE_URL = 'http://localhost:3000/api'
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:3000/api'
const PHYSICAL_DEVICE_IP = '192.168.29.82'

const getExpoHost = () => {
  const debuggerHost =
    Constants.manifest?.debuggerHost || Constants.expoConfig?.hostUri || null
  return debuggerHost?.split(':')[0] || null
}

export const BASE_URL = (() => {
  if (Platform.OS === 'web') return LOCAL_BASE_URL

  const expoHost = getExpoHost()
  if (expoHost) return `http://${expoHost}:3000/api`

  if (Platform.OS === 'android') return ANDROID_EMULATOR_URL
  return `http://${PHYSICAL_DEVICE_IP}:3000/api`
})()

export const API_BASE_URL = BASE_URL
