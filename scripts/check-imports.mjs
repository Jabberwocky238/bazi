#!/usr/bin/env node
/**
 * 包边界规则检查 —— `node scripts/check-imports.mjs`
 *
 * 规则:
 *   R1  外部 (src / worker) 只能以包名 'bazilib' 引入, 不得相对路径深入包内
 *   R2  外部不得绕过包边界直接引 'bazilib/xxx' 子路径
 *   R3  bazilib 内部一律用相对路径, 不得自引包名 'bazilib' (会绕开边界成环)
 *   R4  全仓禁止 `export * from`, 导出必须具名 (含 bazilib 内部各 index.ts)
 *   R5  bazilib 不得反向依赖 src / worker
 *
 * 退出码 0 = 通过, 1 = 有违规。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const PKG = 'bazilib'

/** 递归收集 .ts / .tsx, 跳过 node_modules 与构建产物。 */
function walk(dir, out = []) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

/** 取一个文件里所有 import / export-from 的模块说明符 + 行号。 */
function specifiersOf(src) {
  const out = []
  const lines = src.split('\n')
  lines.forEach((line, i) => {
    // import ... from 'x' / export ... from 'x' / import 'x' / dynamic import('x')
    const re = /(?:^|\s)(?:import|export)\b[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
    let m
    while ((m = re.exec(line))) out.push({ spec: m[1] ?? m[2] ?? m[3], line: i + 1 })
  })
  return out
}

const violations = []
const add = (file, line, rule, msg) =>
  violations.push({ file: path.relative(ROOT, file), line, rule, msg })

// ——— 扫描 ———
const outside = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'worker'))]
const inside = walk(path.join(ROOT, PKG))

for (const file of outside) {
  const src = fs.readFileSync(file, 'utf8')
  for (const { spec, line } of specifiersOf(src)) {
    // R1: 相对路径指到包内
    if (spec.startsWith('.')) {
      const abs = path.resolve(path.dirname(file), spec)
      if (abs === path.join(ROOT, PKG) || abs.startsWith(path.join(ROOT, PKG) + path.sep)) {
        add(file, line, 'R1', `相对路径深入包内: '${spec}' —— 应改为 from '${PKG}'`)
      }
    }
    // R2: 走包名但带子路径
    if (spec === `${PKG}/` || spec.startsWith(`${PKG}/`)) {
      add(file, line, 'R2', `绕过包边界引子路径: '${spec}' —— 应改为 from '${PKG}'`)
    }
  }
}

for (const file of inside) {
  const src = fs.readFileSync(file, 'utf8')
  for (const { spec, line } of specifiersOf(src)) {
    // R3: 包内自引包名
    if (spec === PKG || spec.startsWith(`${PKG}/`)) {
      add(file, line, 'R3', `包内自引包名: '${spec}' —— 包内应用相对路径`)
    }
    // R5: 反向依赖外部
    if (spec.startsWith('.')) {
      const abs = path.resolve(path.dirname(file), spec)
      for (const bad of ['src', 'worker']) {
        if (abs.startsWith(path.join(ROOT, bad) + path.sep) || abs === path.join(ROOT, bad)) {
          add(file, line, 'R5', `包反向依赖 ${bad}/: '${spec}'`)
        }
      }
    }
  }
}

// R4: 全仓禁止 export *
for (const file of [...outside, ...inside]) {
  const src = fs.readFileSync(file, 'utf8')
  src.split('\n').forEach((line, i) => {
    if (/^\s*export\s+\*\s/.test(line)) {
      add(file, i + 1, 'R4', `禁止 export * —— 必须具名导出: ${line.trim()}`)
    }
  })
}

// ——— 报告 ———
const RULES = {
  R1: '外部相对路径深入包内',
  R2: '外部绕过包边界引子路径',
  R3: '包内自引包名',
  R4: '使用了 export *',
  R5: '包反向依赖 src/worker',
}

if (violations.length === 0) {
  console.log(`✅ 包边界检查通过 (扫描 ${outside.length + inside.length} 个文件)`)
  console.log(`   外部 ${outside.length} 个 · ${PKG} 内 ${inside.length} 个`)
  process.exit(0)
}

console.error(`❌ 发现 ${violations.length} 处违规\n`)
const byRule = {}
for (const v of violations) (byRule[v.rule] ??= []).push(v)
for (const rule of Object.keys(RULES)) {
  const list = byRule[rule]
  if (!list?.length) continue
  console.error(`【${rule}】${RULES[rule]} (${list.length} 处)`)
  for (const v of list) console.error(`   ${v.file}:${v.line}  ${v.msg}`)
  console.error('')
}
process.exit(1)
