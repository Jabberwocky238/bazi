import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'

declare module 'vite' {
  interface UserConfig {
    ssgOptions?: {
      onPageRendered?: (route: string, html: string) => string | Promise<string>
      onBeforePageRender?: (route: string, html: string) => string | Promise<string>
      includedRoutes?: (paths: string[]) => string[] | Promise<string[]>
      formatting?: 'minify' | 'prettify' | 'none'
      crittersOptions?: false | Record<string, unknown>
    }
  }
}
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// —— 构建时元信息 (engine 版本 / skills 子模块 commit + 日期) ——
function readEngineVersion(): string {
  try {
    const p = JSON.parse(
      fs.readFileSync(path.join(root, 'node_modules/@jabberwocky238/bazi-engine/package.json'), 'utf-8'),
    )
    return String(p.version ?? 'unknown')
  } catch { return 'unknown' }
}
function gitField(cwd: string, fmt: string): string {
  try {
    return execSync(`git log -1 --pretty=format:${fmt}`, { cwd }).toString().trim()
  } catch { return 'unknown' }
}
const SKILLS_DIR = path.join(root, 'public/bazi-skills')
const ENGINE_VERSION = readEngineVersion()
const SKILLS_COMMIT  = gitField(SKILLS_DIR, '%h')
const SKILLS_DATE    = gitField(SKILLS_DIR, '%cI')
const APP_COMMIT     = gitField(root, '%h')
/** ISO 8601 (UTC) — 客户端按 hostname 选时区现场格式化。 */
function buildTime(): string {
  return new Date().toISOString()
}
const APP_BUILD_TIME = buildTime()

// —— SSG: per-route SEO meta (vite-react-ssg onPageRendered 钩子注入) ——
const CANONICAL_ORIGIN = 'https://bazi.app238.com'
interface RouteSeo { title: string; description: string }
const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': {
    title: '八字补完计划',
    description: '八字补完计划：在线排盘 + 单/合盘干支互动评分、格局识别、通关桥梁分析。纯前端，无需注册。',
  },
  '/hepan': {
    title: '八字合盘 — 八字补完计划',
    description: '八字合盘分析：双盘干支互动评分、跨盘通关桥梁、喜用神匹配。',
  },
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function replaceMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`<meta\\s+${attr}="${escapeRe(key)}"\\s+content="[^"]*"\\s*/?>`)
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`
  return re.test(html) ? html.replace(re, tag) : upsertMeta(html, attr, key, value)
}
function upsertMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  return html.replace(/<\/head>/, `    <meta ${attr}="${key}" content="${escapeHtml(value)}" />\n</head>`)
}
function upsertCanonical(html: string, href: string): string {
  const re = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/
  const tag = `<link rel="canonical" href="${href}" />`
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/, `    ${tag}\n</head>`)
}
function patchSeo(route: string, html: string): string {
  const seo = ROUTE_SEO[route] ?? ROUTE_SEO['/']
  const canonical = `${CANONICAL_ORIGIN}${route === '/' ? '/' : route}`
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
  out = replaceMeta(out, 'name', 'description', seo.description)
  out = replaceMeta(out, 'property', 'og:title', seo.title)
  out = replaceMeta(out, 'property', 'og:description', seo.description)
  out = upsertMeta(out, 'property', 'og:url', canonical)
  out = replaceMeta(out, 'name', 'twitter:title', seo.title)
  out = replaceMeta(out, 'name', 'twitter:description', seo.description)
  out = upsertCanonical(out, canonical)
  return out
}

// https://vite.dev/config/
export default defineConfig({
  ssgOptions: {
    onPageRendered(route: string, html: string) {
      return patchSeo(route, html)
    },
  },
  define: {
    __ENGINE_VERSION__:  JSON.stringify(ENGINE_VERSION),
    __SKILLS_COMMIT__:   JSON.stringify(SKILLS_COMMIT),
    __SKILLS_DATE__:     JSON.stringify(SKILLS_DATE),
    __APP_COMMIT__:      JSON.stringify(APP_COMMIT),
    __APP_BUILD_TIME__:  JSON.stringify(APP_BUILD_TIME),
  },
  resolve: {
    alias: {
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
