import type { Ctx } from '../../types'
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
  // md 条件 4: "大运顺行且与命局深度配合" → 岁运敏感，加重而非成格必要条件
  const meta = ctx.daYunMeta
  const strongFit = !!meta && meta.forward && meta.favorableStreak >= 3
  const badFit = !!meta && (meta.avoidStreak >= 3 || !meta.forward)
  const noteTail = meta
    ? strongFit
      ? ` · 大运顺行 连续喜用 ${meta.favorableStreak} 步`
      : badFit
        ? meta.forward
          ? ` · 大运连续忌用 ${meta.avoidStreak} 步`
          : ' · 大运逆行'
        : ` · 大运顺行 喜用 ${meta.favorableStreak} 步 忌用 ${meta.avoidStreak} 步`
    : ''
  return {
    name: '帝王命造',
    note: `格局清纯 · 流通或专旺 · 日主立得住${noteTail}`,
    suiyunSpecific: true,
    // suiyunDefaultTrigger: true,
    ...(strongFit ? { suiyunTrigger: true } : {}),
    ...(badFit ? { suiyunConquer: true } : {}),
  }
}
