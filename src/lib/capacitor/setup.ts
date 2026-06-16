import { Capacitor } from '@capacitor/core';

/**
 * 检查是否在 Capacitor 原生环境中运行
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前平台名称
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * 初始化 Capacitor 环境
 * 当从远程 URL 加载时，确保 Capacitor JS 桥接已建立
 */
export const initCapacitor = (): void => {
  if (isNativePlatform()) {
    console.log(`[Capacitor] Running on native platform: ${getPlatform()}`);

    // 监听 App 状态变化
    document.addEventListener('deviceready', () => {
      console.log('[Capacitor] Device ready, bridge established');
    });
  } else {
    console.log('[Capacitor] Running on web platform');
  }
};

/**
 * 安全调用原生插件
 * 如果不是原生平台，返回 fallback 值
 */
export async function callNativePlugin<T>(
  pluginMethod: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (isNativePlatform()) {
    try {
      return await pluginMethod();
    } catch (error) {
      console.warn('[Capacitor] Native plugin call failed:', error);
      return fallback;
    }
  }
  return fallback;
}
