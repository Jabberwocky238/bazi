import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { isCaiGuanYinQuan } from '../zongliang'
import { isGuanShaHunZa } from '../guansha'
import { isShangGuanJianGuan, isXiaoShenDuoShi } from '../shishang'
import { checkZhuanWang } from '../zhuanwang'

/**
 * 帝王命造 —— md：「格局清纯不混杂」+ 「五行流通或气势纯粹二者居其一」
 *            + 「日主立得住」+ 「无致命破格」。
 */
export function isDiWangMingZao(ctx: Ctx): GejuHit | null {
  if (ctx.shenRuo && !ctx.deLing) return null
  const hasFull = isCaiGuanYinQuan(ctx) !== null
  const hasZhuan = !!checkZhuanWang(ctx, ctx.dayWx)
  if (!hasFull && !hasZhuan) return null
  if (isGuanShaHunZa(ctx) !== null) return null
  if (isShangGuanJianGuan(ctx) !== null) return null
  if (isXiaoShenDuoShi(ctx) !== null) return null
  // md 条件 4: "大运顺行且与命局深度配合" → 岁运敏感
  return {
    name: '帝王命造',
    note: '格局清纯 · 流通或专旺 · 日主立得住',
    suiyunSpecific: true,
  }
}
