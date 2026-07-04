const app = require("./app.json");

module.exports = () => ({
  ...app,
  expo: {
    ...app.expo,
    extra: {
      ...app.expo.extra,
      publicConfig: {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
        googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      },
    },
  },
});
