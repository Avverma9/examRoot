// यह फ़ाइल डेवलपमेंट और प्रोडक्शन के लिए API बेस URL को मैनेज करती है।

// 1. आपका कंप्यूटर का लोकल IP एड्रेस यहाँ डालें।
const PHYSICAL_DEVICE_IP = '192.168.29.183'; // <-- आपका IP यहाँ सेट है

// 2. आपके लोकल सर्वर का पोर्ट (आमतौर पर 3000)
const PORT = '5000';

// अलग-अलग एनवायरनमेंट के लिए URLs
const PROD_URL = 'https://backend.examroot.cc'; // प्रोडक्शन URL
const LOCAL_URL = `http://${PHYSICAL_DEVICE_IP}:${PORT}`;

// डेवलपमेंट मोड में (__DEV__ true होता है), LOCAL_URL का उपयोग करें।
// प्रोडक्शन में, PROD_URL का उपयोग करें।
const ROOT_URL = __DEV__ ? LOCAL_URL : PROD_URL;

// सभी API एंडपॉइंट्स '/api' पाथ के अंदर हैं
export const BASE_URL = `${ROOT_URL}/api`;
export const API_BASE_URL = `${ROOT_URL}/api`;

// अगर कहीं और ज़रूरत हो तो रूट URL भी एक्सपोर्ट करें
export const EXPORT_URL = ROOT_URL;

// डेवलपमेंट के दौरान कंसोल में URL लॉग करें ताकि पुष्टि हो सके
if (__DEV__) {
  console.log('🚀 API URL (Local Dev):', BASE_URL);
}
