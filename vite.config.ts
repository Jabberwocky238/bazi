import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { cloudflare } from '@cloudflare/vite-plugin'

const root = path.dirname(fileURLToPath(import.meta.url))

// —— 构建时元信息 ——
function gitField(cwd: string, fmt: string): string {
  try {
    return execSync(`git log -1 --pretty=format:${fmt}`, { cwd }).toString().trim()
  } catch { return 'unknown' }
}
const APP_COMMIT     = gitField(root, '%h')
/** ISO 8601 (UTC) — 客户端按 hostname 选时区现场格式化。 */
function buildTime(): string {
  return new Date().toISOString()
}
const APP_BUILD_TIME = buildTime()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_COMMIT__:      JSON.stringify(APP_COMMIT),
    __APP_BUILD_TIME__:  JSON.stringify(APP_BUILD_TIME),
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      bazilib: path.resolve(root, 'bazilib/index.ts'),
      '@@': path.resolve(root, 'src/components'),
    },
  },
  build: {
    // 兼容更老设备：ES2015 (Chrome 51+ / Safari 10+ / 微信 5.3+ / 2016+ 国产浏览器)
    // async/await、可选链、空值合并 均交由 transpiler 降级
    target: 'es2015',
    // Tailwind v4 输出用 oklch() 色函数 (Chrome 111+/Safari 15.4+ 才识别)
    // 用 lightningcss 降级到 rgb，覆盖旧 Android WebView / 微信内置
    cssMinify: 'lightningcss',
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      // 版本号按 Tailwind/lightningcss 格式编码：major << 16 | minor << 8 | patch
      targets: {
        chrome: 51 << 16,    // 2016-09
        safari: 10 << 16,    // 2016-09 (iOS 10)
        firefox: 51 << 16,
        android: 51 << 16,
        ios_saf: 10 << 16,
      },
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // PWA —— 仅保留"可安装"能力,不做任何缓存。
    //   * manifest 满足安装条件 (名称/图标/start_url/display);
    //   * 一个带 fetch handler 的 SW 仅用于满足浏览器安装门槛,fetch 直接回源,
    //     globPatterns 为空 ⇒ 不预缓存,runtimeCaching 不配置 ⇒ 不运行时缓存;
    //   * injectRegister 'auto' 由插件自动注入注册脚本,无需手写注册代码。
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: '八字补完计划',
        short_name: 'UltraBazi',
        description: '在线八字 / 合盘排盘与评分工具：干支互动、格局、通关桥梁一站式分析。',
        theme_color: '#0f0f10',
        background_color: '#0f0f10',
        display: 'standalone',
        lang: 'zh-CN',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: [],              // 不预缓存任何资源
        cleanupOutdatedCaches: true,   // 清掉历史版本的 precache 缓存
        clientsClaim: true,
        // 故意不设 navigateFallback:不返回缓存 index.html,无离线兜底
      },
      // dev 不启用 SW (vite dev server 与 SW 会互相打架)
      devOptions: { enabled: false },
    }),
    // 仅 worker:dev (WITH_WORKER=1) 时挂载 cloudflare 插件,
    // 让 vite dev 直接托管 worker 的 /api/* 路由 (免 build, 免单独 wrangler dev);
    // 普通 `dev` 保持纯前端, 不依赖 worker。
    ...(process.env.WITH_WORKER ? [cloudflare()] : []),
  ],
})
