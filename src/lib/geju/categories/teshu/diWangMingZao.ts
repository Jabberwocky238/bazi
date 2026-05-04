import { readBazi, readStrength, readExtras } from '../../hooks'
import { EMPTY_SUIYUN, deriveVisibility, type GejuHit } from '../../types'
import { isCaiGuanYinQuan } from '../zongliang'
import { isGuanShaHunZa } from '../guansha'
import { isShangGuanJianGuan, isXiaoShenDuoShi } from '../shishang'
import { checkZhuanWang } from '../zhuanwang'

/**
 * 帝王命造 —— md：「格局清纯不混杂」+ 「五行流通或气势纯粹二者居其一」
 *            + 「日主立得住」+ 「无致命破格」。
 *
 * 【岁运】md 条件 4 "大运顺行且与命局深度配合"《滴天髓·岁运》"大运顺则发福,
 *  大运逆则虽贵不显"。
 *  当前实现 (依 daYunMeta):
 *    - meta.forward && favorableStreak ≥ 3 → suiyunTrigger (大运顺行连续喜用 ≥ 3 步)
 *    - !meta.forward 或 avoidStreak ≥ 3   → suiyunConquer (逆行或连续忌用 ≥ 3 步)
 *  挂 suiyunSpecific=true,本格本身就以岁运配合为成立条件之一。
 */
export function isDiWangMingZao(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  const extras = readExtras()
  if (strength.shenRuo && !strength.deLing) return null
  const hasFull = isCaiGuanYinQuan() !== null
  const hasZhuan = !!checkZhuanWang(bazi.dayWx)
  if (!hasFull && !hasZhuan) return null
  if (isGuanShaHunZa() !== null) return null
  if (isShangGuanJianGuan() !== null) return null
  if (isXiaoShenDuoShi() !== null) return null
  // md 条件 4: "大运顺行且与命局深度配合" → 岁运敏感，加重而非成格必要条件
  const meta = extras.daYunMeta
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
  const 岁运 = {
    ...EMPTY_SUIYUN,
    isSuiyun: true,
    Trigger: strongFit,
    Conquer: badFit,
  }
  return {
    name: '帝王命造',
    note: `格局清纯 · 流通或专旺 · 日主立得住${noteTail}`,
    岁运,
    显隐: deriveVisibility(岁运),
  }
}
