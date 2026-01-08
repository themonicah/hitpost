import type { CapacitorConfig } from '@capacitor/cli';

const PRODUCTION_URL = 'https://hitpost.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.hitpost.app',
  appName: 'HitPost',
  webDir: 'out',
  server: {
    url: PRODUCTION_URL,
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'HitPost'
  }
};

export default config;
