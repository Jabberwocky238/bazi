import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ultimatebazi.app',
  appName: '八字补完计划',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    scheme: 'UltimateBazi',
  },
  android: {
    buildOptions: {
      signingType: 'apk',
    },
  },
}

export default config
