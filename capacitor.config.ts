import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAP_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.ultimatebazi.app',
  appName: 'UltimateBazi',
  webDir: 'dist',
  server: {
    androidScheme: isDev ? 'http' : 'https',
    // 开发模式使用本地 Vite 服务器，生产模式使用远程 URL
    url: isDev ? 'http://localhost:5173' : 'https://bazi.app238.com',
    cleartext: isDev, // 开发模式允许明文 HTTP
    // 允许的主机名（用于 Android 网络安全配置）
    hostname: isDev ? 'localhost' : 'bazi.app238.com'
  }
};

export default config;
