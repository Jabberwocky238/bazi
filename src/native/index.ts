// 运行环境收口入口 —— src 内需要原生壳/桌面壳判断与初始化时统一从这里导入。
// is 与 init 各合一: isNativePlatform() 兼判 Capacitor 与 Tauri; initNative() 一次完成两类壳初始化。
export { isNativePlatform, getPlatform, initNative, callNativePlugin } from './setup'
export type { Platform } from './setup'
export { nativeStore, migrateFromLocalStorage } from './store'
export type { NativeStore } from './store'
