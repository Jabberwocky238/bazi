import type { CapacitorConfig } from '@capacitor/cli';

const isDev = !!(process.env.CAP_DEV);

const config: CapacitorConfig = {
  appId: 'com.ultrabazi.app',
  appName: 'UltraBazi',
  webDir: 'dist',
  server: {
    androidScheme: isDev ? 'http' : 'https',
    // 生产模式优先使用随应用安装的 dist，避免首屏依赖网络。
    // 新资源由 Worker 托管并通过 Service Worker 在后台更新。
    ...(isDev ? { url: 'http://localhost:5173' } : {}),
    cleartext: isDev, // 开发模式允许明文 HTTP
    // 允许的主机名（用于 Android 网络安全配置）
    hostname: isDev ? 'localhost' : 'bazi.app238.com'
  }
};

export default config;
