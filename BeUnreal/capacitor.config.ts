import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'BeUnreal',
  webDir: 'dist',
  server: {
    url: "http://192.168.2.48:5173/",
    cleartext: true,
  },
  plugins: {
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;
