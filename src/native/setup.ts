import { Capacitor } from '@capacitor/core';
import { isTauri } from '@tauri-apps/api/core';

// ————————————————————————————————————————————————————————
// 运行环境收口 —— src 内所有"是否原生壳"的判断与初始化都从这里走。
// 统一覆盖两类壳:
//   - Capacitor 原生壳 (iOS/Android) → <html>.native + native: 修饰符 (safe-area)
//   - Tauri 桌面壳 (macOS/Windows)    → <html>.native (与 Capacitor 共用, 桌面端禁拖拽/误选)
//
// 网页端 (普通浏览器) 与 SSG (vite-react-ssg 在 node 端预渲染) 都不是上述任一壳,
// 这里所有副作用都带 typeof window guard, 网页端零开销、SSG 不炸。
// is 与 init 各合一为单个接口: isNativePlatform() 兼判 Capacitor 与 Tauri; initNative() 一次
// 完成两类壳的初始化 (按实际平台分流加对应 class)。
//
// 模块内私有全局状态 state (不导出): 是否已初始化 + 平台标识。默认未初始化 (platform='web'),
// 由 initNative() 探测并写入, 之后 isNativePlatform()/getPlatform() 直接读 state, 不再做实时探测。
// ————————————————————————————————————————————————————————

/** 平台标识 —— 六种: windows / android / ios / macos / web / pwa。 */
export type Platform = 'windows' | 'android' | 'ios' | 'macos' | 'web' | 'pwa';

// 模块内私有状态 (不导出): 是否已初始化 + 平台标识。
// 默认 initialized=false、platform='web'; initNative() 负责探测并写入。
const state: { initialized: boolean; platform: Platform } = {
  initialized: false,
  platform: 'web',
};

/** Tauri 桌面壳下据 userAgent 判 OS: macos / windows (其余归 web)。 */
const desktopOS = (): 'macos' | 'windows' | 'web' => {
  const ua = navigator.userAgent || '';
  if (/Mac|iPhone|iPad|iPod/.test(ua)) return 'macos';
  if (/Win/.test(ua)) return 'windows';
  return 'web';
};

/** 是否以 PWA (standalone) 模式安装运行 —— 独立于 Capacitor/Tauri 壳的 web 安装态。 */
const isPWA = (): boolean => {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari 旧式安装态标识
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

/** 是否在 Tauri 桌面壳中。仅在 window 存在时调用。 */
const isTauriShell = (): boolean => {
  try {
    return isTauri();
  } catch {
    return false;
  }
};

/** 实时探测当前平台 (六态) —— 仅由 initNative 调用一次, 结果写入 state。 */
const detectPlatform = (): Platform => {
  const cap = Capacitor.getPlatform();
  if (cap === 'ios') return 'ios';
  if (cap === 'android') return 'android';
  if (isTauriShell()) return desktopOS() === 'windows' ? 'windows' : 'macos';
  if (isPWA()) return 'pwa';
  return 'web';
};

/**
 * 是否在原生壳中运行 —— Capacitor (iOS/Android) 或 Tauri (桌面)。
 * 即平台 ∈ {ios, android, macos, windows}; web/pwa 返回 false。
 * 直接读 state (由 initNative 写入); initNative 前默认 false。
 */
export const isNativePlatform = (): boolean => {
  const p = state.platform;
  return p === 'ios' || p === 'android' || p === 'macos' || p === 'windows';
};

/**
 * 当前平台 —— 统一六态:
 *   ios / android : Capacitor 原生壳
 *   macos / windows : Tauri 桌面壳 (按 OS)
 *   pwa : 网页安装态 (display-mode: standalone)
 *   web : 普通浏览器
 * 优先级: Capacitor 原生 > Tauri 桌面 > PWA > web。
 * 直接读 state (由 initNative 写入); initNative 前默认 'web'。
 */
export const getPlatform = (): Platform => state.platform;

/**
 * 原生壳表现层初始化 + 平台探测 —— 探测当前平台写入私有 state, 并按平台分流打 class:
 *
 * Capacitor (iOS/Android):
 * - .native → index.css 的 `native:` 修饰符据此生效 (AppBar/Drawer/BottomBar 的
 *   safe-area padding)。
 * - viewport-fit=cover → 否则 env(safe-area-inset-*) 恒为 0, 顶部仍顶到刘海下。
 * - 监听 deviceready (从远程 URL 加载时确保 JS bridge 已建立)。
 *
 * Tauri (桌面):
 * - .native → 与 Capacitor 共用同一 class, 桌面端据此抑制 -webkit-user-drag (拖拽
 *   整页/图片) 与 user-select 误选 (输入控件仍放行)。
 *
 * 网页端 (非任一壳) 完全不动 DOM/viewport, 零副作用 (仅 state.platform 落定为 web/pwa)。
 * SSG (node 端预渲染, 无 window) 直接返回, state 保持默认。
 */
export const initNative = (): void => {
  if (typeof window === 'undefined') return;

  const platform = detectPlatform();
  state.platform = platform;
  state.initialized = true;

  // —— Capacitor 原生壳 ——
  if (platform === 'ios' || platform === 'android') {
    console.log(`[Capacitor] Running on native platform: ${platform}`);
    document.documentElement.classList.add('native');
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover',
      );
    document.addEventListener('deviceready', () => {
      console.log('[Capacitor] Device ready, bridge established');
    });
    return;
  }

  // —— Tauri 桌面壳 ——
  if (platform === 'macos' || platform === 'windows') {
    console.log('[Tauri] Running on desktop platform');
    document.documentElement.classList.add('native');
    return;
  }

  console.log(`[Platform] Running on ${platform} platform`);
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
