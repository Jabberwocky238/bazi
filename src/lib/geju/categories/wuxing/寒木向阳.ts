import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 寒木向阳（依 md 成立条件 + 判断维度）：
 *  1. 日主为木（甲/乙）。
 *  2. 月令为冬（亥/子/丑）。
 *  3. 天干透火（丙或丁），仅地支巳午为根不够。
 *  4. 火不过烈（火透 < 3）。
 *  5. 水的数量 ≥ 1 且 ≤ 火的数量（无水则火燥、水过火则寒凝；等量允许，调候仍可成）。
 *  6. 木有根（含中气）。
 *  **岁运特定**：火/木运向阳发力；金/水运寒景加深。
 *    - 原局不成 + 岁运补火/补水达标 → suiyunTrigger
 *    - 原局成 + 岁运金水冲散（水≥火 或 火透消失） → suiyunBreak
 */
export function judgeHanMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.rootExt('木')) return null                    // md 条件 6: 木有根

  // —— 原局五行计数 ——
  const natHuoGan = ctx.ganWxCount('火')
  const natShuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const natHuoN = natHuoGan + ctx.zhiMainWxCount('火')
  const natTouHuo = ctx.touWx('火')
  const natOk =
    natTouHuo && natHuoGan < 3 && natShuiN >= 1 && natShuiN <= natHuoN

  // —— 含岁运（大运/流年）的合并计数 ——
  const exHuoGan = ctx.extraGanWxCount('火')
  const exHuoZhi = ctx.extraZhiMainWxCount('火')
  const exShuiGan = ctx.extraGanWxCount('水')
  const exShuiZhi = ctx.extraZhiMainWxCount('水')
  const allHuoGan = natHuoGan + exHuoGan
  const allHuoN = natHuoN + exHuoGan + exHuoZhi
  const allShuiN = natShuiN + exShuiGan + exShuiZhi
  const allTouHuo = natTouHuo || exHuoGan > 0
  const allOk =
    allTouHuo && allHuoGan < 3 && allShuiN >= 1 && allShuiN <= allHuoN

  if (!natOk && !allOk) return null

  const hasExtra = ctx.extraPillars.length > 0
  const suiyunTrigger = hasExtra && !natOk && allOk
  const suiyunBreak = hasExtra && natOk && !allOk

  const tag = suiyunTrigger
    ? ' · 岁运补齐'
    : suiyunBreak
      ? ' · 岁运冲散'
      : ''
  return {
    name: '寒木向阳',
    note: `冬木有根 · 火透调候 · 水${allShuiN}<火${allHuoN}${tag}`,
    suiyunSpecific: true,
    ...(suiyunTrigger ? { suiyunTrigger: true } : {}),
    ...(suiyunBreak ? { suiyunBreak: true } : {}),
  }
}
