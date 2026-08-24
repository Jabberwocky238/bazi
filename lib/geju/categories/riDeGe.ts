// @ts-nocheck — 孤立文件: 依赖 commit 8ff72ee 删除的 ../snapshot 全局读取 API,
//   未接入 geju/index.ts 的 DETECTORS 表 (无任何引用)。待改写为 GejuContext 后再启用。
import { readBazi, readExtras, readShishen } from '../snapshot'
import { CHONG_PAIR } from '../types'
import type { GejuHit } from '../types'
import { emitGeju } from '../_emit'

/**
 * 日德格 (《三命通会·论日德》4 条 + 1 魁罡破):
 *  ① 日柱为甲寅/丙辰/戊辰/庚辰/壬戌。
 *  ② 日德叠见 (年/月/时再有一位日德)。
 *  ③ 日支不冲。
 *  ④ 无紧贴七杀。
 *  ⑤ 不犯相应忌魁罡 (主局 OR 岁运)。
 *
 * 【岁运】md 条件 5 尾 "大运流年遇相应忌魁罡亦有大灾":
 *   - 主局成格 + 岁运含相应 forbiddenKuigang → suiyunBreak。
 */
const RI_DE = new Set(['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'])

const RI_DE_FORBIDDEN_KUIGANG: Record<string, string[]> = {
  甲寅: ['庚辰'],
  丙辰: ['壬辰'],
  戊辰: ['壬戌'],
  庚辰: ['庚戌', '甲寅'],
  壬戌: ['戊戌'],
}

export function isRiDeGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  if (!RI_DE.has(bazi.dayGz)) return null
  const { year, month, hour } = bazi.pillars
  const otherGzs = [
    year.gan.name + year.zhi.name,
    month.gan.name + month.zhi.name,
    hour.gan.name + hour.zhi.name,
  ]
  if (!otherGzs.some((gz) => RI_DE.has(gz))) return null
  const dzChong = CHONG_PAIR[bazi.dayZhi as string]
  if (dzChong && [year.zhi.name, month.zhi.name, hour.zhi.name].includes(dzChong as never)) return null
  if (shishen.tou('七杀') && (
    month.gan.shishen === '七杀' || hour.gan.shishen === '七杀'
  )) return null
  const forbiddenKuigang = RI_DE_FORBIDDEN_KUIGANG[bazi.dayGz] ?? []
  if (otherGzs.some((gz) => forbiddenKuigang.includes(gz))) return null

  // 岁运忌魁罡判定
  const extrasViolate = extras.extraArr.some(
    (p) => forbiddenKuigang.includes(`${p.gan.name}${p.zhi.name}`),
  )

  // 主局已成格 — 仅看岁运是否破
  return emitGeju(
    {
      name: '日德格',
      note: `日柱 ${bazi.dayGz} · 叠见日德 · 日支不冲 · 无忌魁罡`,
    },
    { baseFormed: true, withExtrasFormed: !extrasViolate, hasExtras: extras.active },
  )
}
