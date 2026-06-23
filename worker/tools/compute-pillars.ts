import { tool, type Tool, type ToolContext } from '../tooldef'
import type { DetailedPillar } from '@jabberwocky238/bazi-engine'
import { Calculator, parseGz, type Sex } from './_helpers'

/**
 * compute_pillars —— 根据八字四柱 + 性别计算四柱详情。
 * 输入可省略: 不传时从请求头注入的 ctx.context.basics 取 (bazi + sex)。
 * 返回每柱的 干支 / 五行 / 十神 / 藏干(含十神五行) / 纳音 / 神煞 / 长生,
 * 渲染为 Markdown 表格文本 (而非 JSON) 供模型直接朗读给用户。
 */

/** 把 DetailedPillar[] 渲染成 Markdown 表格。 */
function renderPillarsMarkdown(pillars: DetailedPillar[]): string {
  // 表头: 柱 | 天干(五行·十神) | 地支(五行·长生) | 藏干(十神) | 纳音 | 神煞
  const header = '| 柱 | 天干 (五行·十神) | 地支 (五行·长生) | 藏干 (十神) | 纳音 | 神煞 |'
  const sep = '| --- | --- | --- | --- | --- | --- |'
  const rows = pillars.map((p) => {
    const gan = `${p.gan.name} (${p.gan.wuxing}·${p.gan.shishen})`
    const zhi = `${p.zhi.name} (${p.zhi.wuxing}·${p.changsheng})`
    const cangGan = p.zhi.cangGan.map((c) => `${c.name}(${c.shishen})`).join(' ')
    const shensha = p.shensha.length ? p.shensha.join('、') : '—'
    return `| ${p.label} | ${gan} | ${zhi} | ${cangGan} | ${p.nayin} | ${shensha} |`
  })
  return [header, sep, ...rows].join('\n')
}

export const computePillars: Tool<{
  bazi?: string[]
  sex?: number
}> = tool({
  name: 'compute_pillars',
  description:
    '根据八字四柱干支与性别计算四柱详情(天干/地支的五行、十神、藏干、纳音、神煞、十二长生), 并渲染成 Markdown 表格文本。' +
    '可不传参数: 缺省时自动用当前命盘的八字与性别(来自请求头 X-BAZI-BASICS)。',
  parameters: {
    type: 'object',
    properties: {
      bazi: {
        type: 'array',
        items: { type: 'string' },
        description: '四柱干支, 如 ["甲子","丙寅","戊午","庚申"]; 时柱未知时为空串。',
      },
      sex: { type: 'integer', description: '性别: 1 男 / 0 女' },
    },
    additionalProperties: false,
  },
  async execute(args, ctx: ToolContext) {
    // 参数缺省 → 回退到请求头注入的 basics
    const basics = (ctx.context as { basics?: { bazi?: string[]; sex?: number } } | undefined)?.basics
    const bazi = args.bazi ?? basics?.bazi
    const sex = (args.sex ?? basics?.sex ?? 1) as Sex
    if (!bazi || bazi.length < 3) {
      return JSON.stringify({ error: '需要至少年月日三柱八字 (或当前命盘未提供)' })
    }
    const [y, m, d, h = ''] = bazi
    const hourKnown = h.length === 2
    try {
      const calc = new Calculator(
        {
          year: parseGz(y),
          month: parseGz(m),
          day: parseGz(d),
          hour: hourKnown ? parseGz(h) : undefined,
          sex,
        },
      )
      const pillars = calc.pillars()
      return renderPillarsMarkdown(pillars)
    } catch (e) {
      return JSON.stringify({ error: `计算失败: ${e instanceof Error ? e.message : String(e)}` })
    }
  },
})
