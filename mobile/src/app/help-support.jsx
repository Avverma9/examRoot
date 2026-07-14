import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'examrootofficial@gmail.com';
const WHATSAPP_NUMBER = '7004198258'; // replace with real number

const FAQS = [
  {
    q: 'How do I take a mock test?',
    a: 'Go to the Home tab, browse available test series, and tap a test to start. You can pause and resume tests at any time.',
  },
  {
    q: 'Are the questions updated regularly?',
    a: 'Yes, our content team adds new questions and updates existing ones based on the latest exam patterns and syllabus changes.',
  },
  {
    q: 'How is my accuracy calculated?',
    a: 'Accuracy = (Correct Answers / Total Attempted) × 100. It is updated after each test you complete.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'Currently the app requires an internet connection. Offline mode is on our roadmap and will be available in a future update.',
  },
  {
    q: 'How do I change my preferred language?',
    a: 'Go to Profile → Settings → Language and select English or Hindi. Some content may still be in English while translation is in progress.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Subscriptions are managed through the Play Store. Go to Google Play → Subscriptions and cancel from there. You keep access until the billing period ends.',
  },
];

const FAQItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.8}
      className="bg-white rounded-xl mb-2 overflow-hidden border border-gray-100"
    >
      <View className="flex-row items-center px-4 py-4">
        <Text className="flex-1 text-gray-800 text-sm font-medium pr-2">{item.q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
      </View>
      {open && (
        <View className="px-4 pb-4 pt-0">
          <View className="border-t border-gray-100 pt-3">
            <Text className="text-gray-500 text-sm leading-6">{item.a}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=ExamRoot Support`).catch(() =>
      Alert.alert('Error', 'No email client found on this device.')
    );
  };

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20need%20help%20with%20ExamRoot`).catch(
      () => Alert.alert('Error', 'WhatsApp is not installed on this device.')
    );
  };

  return (
    <View className="flex-1 bg-orange-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-orange-500 border-b border-orange-600">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white flex-1">Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Contact Cards */}
        <View className="px-4 pt-5 flex-row">
          {/* Email */}
          <TouchableOpacity
            onPress={openEmail}
            className="flex-1 bg-blue-50 rounded-2xl p-4 items-center mr-2 border border-blue-100"
          >
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center mb-3">
              <Feather name="mail" size={22} color="#ffffff" />
            </View>
            <Text className="text-gray-800 font-semibold text-sm">Email Us</Text>
            <Text className="text-blue-500 text-xs mt-1 text-center">{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity
            onPress={openWhatsApp}
            className="flex-1 bg-green-50 rounded-2xl p-4 items-center ml-2 border border-green-100"
          >
            <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mb-3">
              <Feather name="message-circle" size={22} color="#ffffff" />
            </View>
            <Text className="text-gray-800 font-semibold text-sm">WhatsApp</Text>
            <Text className="text-green-600 text-xs mt-1 text-center">Chat with us</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View className="px-4 pt-6">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </Text>
          {FAQS.map((item, idx) => (
            <FAQItem key={idx} item={item} />
          ))}
        </View>

        {/* App Version */}
        <View className="px-4 pt-6 pb-10 items-center">
          <Text className="text-xs text-gray-400">ExamRoot v{APP_VERSION}</Text>
          <Text className="text-xs text-gray-400 mt-1">Made with ❤️ in India</Text>
        </View>
      </ScrollView>
    </View>
  );
}
