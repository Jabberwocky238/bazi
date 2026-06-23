import { describe, expect, test } from 'bun:test'
import { computePillars } from './compute-pillars'
import type { ToolContext } from '../tooldef'

// ————————————————————————————————————————————————————————
// compute_pillars 工具单测 —— 成功返回 Markdown 表格文本, 失败返回 { error } JSON。
// ————————————————————————————————————————————————————————

/** 成功输出按行拆分, 仅保留数据行 (跳过表头与分隔行)。 */
function tableRows(out: string): string[] {
  return out
    .split('\n')
    .filter((l) => l.startsWith('| '))
    .filter((l) => !l.includes('---'))
    .filter((l) => cells(l)[0] !== '柱')
}

/** 解析一行表格单元格 (去掉首尾 | 与空格)。 */
function cells(row: string): string[] {
  return row.slice(1, -1).split('|').map((c) => c.trim())
}

/** 构造只含 basics 的 ToolContext (模拟请求头注入的命盘)。 */
function ctxWithBasics(bazi: string[], sex = 1): ToolContext {
  return { context: { basics: { bazi, sex } } }
}

describe('compute_pillars', () => {
  test('显式传四柱 + 性别, 返回 Markdown 表格 4 行', async () => {
    const out = await computePillars.execute(
      { bazi: ['甲子', '丙寅', '戊午', '庚申'], sex: 1 },
      { context: {} },
    )
    const rows = tableRows(out)
    expect(rows.length).toBe(4)
    // 干支原样回填: 每行第二/三个单元格以 干/支 开头
    const [r0, , r2] = rows
    const c0 = cells(r0!)
    const c2 = cells(r2!)
    expect(c0[0]).toBe('年柱')
    expect(c0[1]).toContain('甲')
    expect(c0[2]).toContain('子')
    expect(c0[4]).toBe('海中金') // 纳音
    // 日柱天干十神标记为日主
    expect(c2[1]).toContain('日主')
  })

  test('时柱未知 (空串) 时表格只有 3 行', async () => {
    const out = await computePillars.execute(
      { bazi: ['甲子', '丙寅', '戊午', ''], sex: 0 },
      { context: {} },
    )
    expect(tableRows(out).length).toBe(3)
  })

  test('不足三柱返回 error JSON', async () => {
    const out = await computePillars.execute(
      { bazi: ['甲子', '丙寅'], sex: 1 },
      { context: {} },
    )
    expect(JSON.parse(out)).toEqual({ error: expect.stringContaining('三柱') })
  })

  test('缺省参数时回退到 ctx.context.basics', async () => {
    const out = await computePillars.execute(
      {},
      ctxWithBasics(['甲子', '丙寅', '戊午', '庚申'], 1),
    )
    const rows = tableRows(out)
    expect(rows.length).toBe(4)
    expect(cells(rows[0]!)[1]).toContain('甲')
  })

  test('参数与 basics 均缺失时返回 error JSON', async () => {
    const out = await computePillars.execute({}, { context: {} })
    expect(JSON.parse(out)).toEqual({ error: expect.stringContaining('三柱') })
  })

  test('非法干支被捕获为 error JSON', async () => {
    const out = await computePillars.execute(
      { bazi: ['甲子', '丙寅', '戊午', 'XX'], sex: 1 },
      { context: {} },
    )
    expect(JSON.parse(out)).toEqual({ error: expect.stringMatching(/计算失败/) })
  })
})
