import { Capacitor } from '@capacitor/core';

// ————————————————————————————————————————————————————————
// Capacitor 运行环境收口 —— src 内所有"是否原生壳"的判断与初始化都从这里走。
//
// 网页端 (普通浏览器) 与 SSG (vite-react-ssg 在 node 端预渲染) 都不是原生平台,
// 这里所有副作用都带 typeof window / isNativePlatform 双重 guard, 网页端零开销、
// SSG 不炸。原生壳特有的表现层 (safe-area 避让) 通过 <html>.native + index.css 的
// native: 修饰符联动, 见 main.tsx -> initCapacitor()。
// ————————————————————————————————————————————————————————

/** 是否在 Capacitor 原生壳 (iOS/Android) 中运行。 */
export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

/** 当前平台名 (ios / android / web)。 */
export const getPlatform = (): string => Capacitor.getPlatform();

/**
 * 原生壳表现层初始化 —— 给 <html> 打 .native, 并把 viewport 改成 viewport-fit=cover。
 *
 * - .native  → index.css 的 `native:` 修饰符据此生效 (AppBar/Drawer/BottomBar 的
 *   safe-area padding)。
 * - viewport-fit=cover → 否则 env(safe-area-inset-*) 恒为 0, 顶部仍顶到刘海下。
 *
 * 网页端 (非原生) 完全不动 viewport, 也不加 .native —— env() 在无 cover 时本就为 0,
 * 故 native:* 类在网页端无副作用。
 */
export const initCapacitor = (): void => {
  if (!isNativePlatform()) {
    console.log('[Capacitor] Running on web platform');
    return;
  }

  console.log(`[Capacitor] Running on native platform: ${getPlatform()}`);
  document.documentElement.classList.add('native');
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover',
    );

  // 监听桥接就绪 (从远程 URL 加载时确保 JS bridge 已建立)。
  document.addEventListener('deviceready', () => {
    console.log('[Capacitor] Device ready, bridge established');
  });
};

/**
 * 安全调用原生插件 —— 非原生平台或调用失败时返回 fallback。
 */
export async function callNativePlugin<T>(
  pluginMethod: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isNativePlatform()) return fallback;
  try {
    return await pluginMethod();
  } catch (error) {
    console.warn('[Capacitor] Native plugin call failed:', error);
    return fallback;
  }
}
