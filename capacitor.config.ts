import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whiteboard.ifpapp',
  appName: 'PaadamVazhi',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#292A2E',
    allowMixedContent: true
  }
};

export default config;
