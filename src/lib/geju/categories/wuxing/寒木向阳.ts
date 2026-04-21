import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 寒木向阳（依 md 成立条件 + 判断维度）：
 *  1. 日主为木（甲/乙）。
 *  2. 月令为冬（亥/子/丑）。
 *  3. 天干透火（丙或丁），仅地支巳午为根不够。
 *  4. 火不过烈（火透 < 3）。
 *  5. 水的数量 ≥ 1 且 < 火的数量（无水则火燥、水重则寒凝）。
 *  6. 木有根（含中气）。
 *  **岁运特定**：火/木运向阳发力；金/水运寒景加深。
 */
export function judgeHanMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null                  // md 条件 3: 天干透火
  if (!ctx.rootExt('木')) return null                // md 条件 6: 木有根
  if (ctx.ganWxCount('火') >= 3) return null         // md 条件 4: 火不过烈
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const huoN = ctx.ganWxCount('火') + ctx.zhiMainWxCount('火')
  if (shuiN < 1) return null                          // md 条件 5: 水 ≥ 1
  if (shuiN >= huoN) return null                      // md 条件 5: 水 < 火
  return {
    name: '寒木向阳',
    note: `冬木有根 · 火透调候 · 水${shuiN}<火${huoN}`,
    suiyunSpecific: true,
  }
}
