import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: Update this URL after deploying to Vercel
const PRODUCTION_URL = 'https://hitpost.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.hitpost.app',
  appName: 'HitPost',
  webDir: 'out',
  server: {
    // In production, the app loads from your Vercel server
    url: PRODUCTION_URL,
    cleartext: false
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
