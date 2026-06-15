import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@jabberwocky238/bazi-engine': path.resolve(root, 'bazi-engine/src/index.ts'),
      '@': path.resolve(root, 'src'),
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
  ],
})
