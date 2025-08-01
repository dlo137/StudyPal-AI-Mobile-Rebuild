// app.config.js
export default {
  expo: {
    name: "StudyPal AI",
    slug: "studypal-ai-mobile-backend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.studypal.aihomework",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.studypal.aihomework",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "studypal",
    plugins: [
      "expo-notifications"
    ],
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      eas: {
        projectId: "b4403e91-5a15-439e-8f4a-df74c8f7f907"
      }
    },
  },
};