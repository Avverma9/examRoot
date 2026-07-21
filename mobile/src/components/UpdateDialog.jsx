import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { dismissUpdate } from '../services/appUpdateApi';

export default function UpdateDialog({ visible, update, onDismiss, isDismissing }) {
  const token = useSelector((state) => state.auth.token);
  const language = useSelector((state) => state.auth.user?.preferredLanguage || 'en');

  if (!update) return null;

  const changelog = language === 'hi' ? update.changelogHindi : update.changelogEnglish;
  const title = language === 'hi' ? 'नया अपडेट उपलब्ध है!' : 'New Update Available!';
  const isMandatory = update.isMandatory;

  const handleUpdate = async () => {
    try {
      // Open download link first
      const supported = await Linking.canOpenURL(update.downloadLink);
      if (supported) {
        await Linking.openURL(update.downloadLink);
        // Mark as dismissed (installed) after opening link
        onDismiss(true);
      } else {
        Alert.alert('Error', 'Unable to open download link');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to open download link');
    }
  };

  const handleLater = () => {
    if (isMandatory) {
      Alert.alert(
        language === 'hi' ? 'अनिवार्य अपडेट' : 'Mandatory Update',
        language === 'hi'
          ? 'यह एक अनिवार्य अपडेट है। कृपया ऐप का उपयोग जारी रखने के लिए अपडेट करें।'
          : 'This is a mandatory update. Please update to continue using the app.'
      );
      return;
    }

    onDismiss(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isMandatory ? undefined : () => onDismiss(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-5">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 items-center">
            <View className="bg-white/20 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Feather name="download-cloud" size={40} color="#ffffff" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">
              {title}
            </Text>
            <Text className="text-blue-100 text-lg font-semibold mt-2">
              Version {update.version}
            </Text>
            {isMandatory && (
              <View className="bg-red-500 px-4 py-1 rounded-full mt-3">
                <Text className="text-white text-xs font-bold">
                  {language === 'hi' ? 'अनिवार्य' : 'MANDATORY'}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView className="max-h-64 p-6">
            {changelog || update.description ? (
              <Text className="text-gray-700 text-sm leading-6">
                {changelog || update.description}
              </Text>
            ) : (
              <Text className="text-gray-500 text-sm text-center italic">
                {language === 'hi' ? 'बग फिक्स और सुधार' : 'Bug fixes and improvements'}
              </Text>
            )}
          </ScrollView>

          {/* Actions */}
          <View className="p-6 pt-0">
            <TouchableOpacity
              onPress={handleUpdate}
              className="bg-blue-600 py-4 rounded-xl items-center justify-center flex-row mb-3"
            >
              <Feather name="download" size={18} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2">
                {language === 'hi' ? 'अभी अपडेट करें' : 'Update Now'}
              </Text>
            </TouchableOpacity>

            {!isMandatory && (
              <TouchableOpacity
                onPress={handleLater}
                className="py-3 items-center"
                disabled={isDismissing}
              >
                <Text className="text-gray-500 font-medium text-sm">
                  {language === 'hi' ? 'बाद में' : 'Later'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
