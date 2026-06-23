import { Preferences } from '@capacitor/preferences'
import { load as loadTauriStore } from '@tauri-apps/plugin-store'
import { getPlatform } from './setup'

// ————————————————————————————————————————————————————————
// 统一存储适配器 —— src 内所有持久化 (命例/草稿/设置) 都从这里走, 不再直接碰 localStorage。
//
// 按平台分流 (平台由 setup.ts 的 initNative() 在 main.tsx 模块顶层探测, 先于任何 store 读取):
//   - ios / android        → Capacitor Preferences (@capacitor/preferences)
//   - macos / windows      → Tauri plugin-store  (@tauri-apps/plugin-store)
//   - web / pwa            → localStorage (同步, 包 Promise)
//
// 两个插件静态 import —— 均自带 web 安全性: Preferences 内部即 localStorage fallback,
// plugin-store 模块顶层无副作用, 仅 getPlatform() 判定原生后才调用。代价是 web bundle 多带两份代码。
// 接口刻意对齐 localStorage 语义 (但全异步): getItem/setItem/removeItem。
// 每个方法 try/catch 吞异常 (与旧 loadAll/saveAll 容错风格一致): 读失败返回 null, 写失败静默, 不抛。
//
// SSG (vite-react-ssg 在 node 端预渲染) 下 getPlatform() 返回 'web' 但无 localStorage —— ls 分支带 guard, 返回 null/空操作。
// ————————————————————————————————————————————————————————

export interface NativeStore {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

type Backend = 'capacitor' | 'tauri' | 'localStorage'

// 模块内私有缓存: 已探测的 backend + 对应插件实例。首次调用 resolve() 时落定, 之后复用。
let backend: Backend | null = null
let tauriStore: Awaited<ReturnType<typeof loadTauriStore>> | null = null

const TAURI_STORE_FILE = '.saved.json'

/** 探测并初始化 backend (仅首次调用, Tauri 下创建 store handle)。 */
async function resolve(): Promise<Backend> {
  if (backend) return backend

  const platform = getPlatform()
  try {
    if (platform === 'ios' || platform === 'android') {
      backend = 'capacitor'
    } else if (platform === 'macos' || platform === 'windows') {
      tauriStore = await loadTauriStore(TAURI_STORE_FILE, { autoSave: true })
      backend = 'tauri'
    } else {
      backend = 'localStorage'
    }
  } catch {
    // 插件初始化失败 (如原生壳未注册 plugin) → 退回 localStorage 兜底, 不阻断功能。
    backend = 'localStorage'
  }
  return backend
}

export const nativeStore: NativeStore = {
  async getItem(key: string): Promise<string | null> {
    const b = await resolve()
    try {
      if (b === 'capacitor') return (await Preferences.get({ key })).value
      if (b === 'tauri') {
        const v = await tauriStore!.get<string>(key)
        return v ?? null
      }
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const b = await resolve()
    try {
      if (b === 'capacitor') await Preferences.set({ key, value })
      else if (b === 'tauri') await tauriStore!.set(key, value)
      else if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
    } catch {
      /* 静默: 与旧 saveAll 一致, 落盘失败不抛 */
    }
  },

  async removeItem(key: string): Promise<void> {
    const b = await resolve()
    try {
      if (b === 'capacitor') await Preferences.remove({ key })
      else if (b === 'tauri') await tauriStore!.delete(key)
      else if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    } catch {
      /* 静默 */
    }
  },
}

// ————————————————————————————————————————————————————————
// 旧数据迁移 —— 仅原生 backend 有意义 (web 下 localStorage 既是 backend, 无需迁移)。
//
// 生产 Capacitor 壳从远程 URL (bazi.app238.com) 加载, 老用户的命例原本存在 webview localStorage 里。
// 切到 Preferences/plugin-store 后, 首次启动若原生侧为空而 localStorage 有值, 把给定 keys 拷过去。
// 幂等: 原生侧已有值的 key 跳过, 重复调用无副作用。
// ————————————————————————————————————————————————————————

/**
 * 把 localStorage 中存在、但原生 backend 尚未持有的 keys 拷到原生侧。
 * web/pwa 下 no-op。供各 store 在 init 时按需调用 (传入自己负责的 keys)。
 */
export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
  const b = await resolve()
  if (b === 'localStorage') return // web 既用 localStorage, 无迁移概念
  if (typeof localStorage === 'undefined') return

  for (const key of keys) {
    try {
      const nativeVal = await nativeStore.getItem(key)
      if (nativeVal != null) continue // 原生已有, 不覆盖
      const lsVal = localStorage.getItem(key)
      if (lsVal != null) await nativeStore.setItem(key, lsVal)
    } catch {
      /* 单 key 失败不影响其余 */
    }
  }
}
