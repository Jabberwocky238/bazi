import { CHONG_PAIR, type Ctx } from '../ctx'
import type { GejuHit } from '../types'
import { ganWuxing } from '../../wuxing'
import { isCaiGuanYinQuan } from './zongliang'
import { isGuanShaHunZa } from './guansha'
import { isShangGuanJianGuan, isXiaoShenDuoShi } from './shishang'
import { checkZhuanWang } from './zhuanwang'

/**
 * 三奇格 —— md：天干四位中同时含某一组三奇 (乙丙丁 / 甲戊庚 / 壬癸辛) 全部；
 *   「顺排」: 三奇按 年月日时 顺序出现；「中间字必须在中间位」。
 */
const SAN_QI: Array<[string, string, string]> = [
  ['乙', '丙', '丁'],
  ['甲', '戊', '庚'],
  ['壬', '癸', '辛'],
]
export function isSanQiGe(ctx: Ctx): GejuHit | null {
  const gans = ctx.pillars.map((p) => p.gan)
  for (const trio of SAN_QI) {
    const positions = trio.map((g) => gans.indexOf(g))
    if (positions.some((p) => p < 0)) continue
    const sorted = [...positions].sort((a, b) => a - b)
    if (positions.join() !== sorted.join()) return null
    return { name: '三奇格', note: `天干顺排 ${trio.join('')} 三奇` }
  }
  return null
}

/**
 * 三庚格 —— md：「天干四位中至少三位为庚金」+ 「庚金为日主喜用」。
 *   庚金为用 = 日主为甲乙木 (庚为官杀 需有根以任官) 或 丙丁火 (庚为财)；
 *   日主为庚辛金 (庚为比劫) → md 明文: 「庚金为忌神 → 破格」。
 */
export function isSanGengGe(ctx: Ctx): GejuHit | null {
  const gengN = ctx.pillars.filter((p) => p.gan === '庚').length
  if (gengN < 3) return null
  if (ctx.dayWx === '金') return null
  if (ctx.dayWx === '木' && ctx.shenRuo) return null
  return { name: '三庚格', note: `天干庚 ${gengN} 位 · 日主${ctx.dayGan}为用` }
}

/**
 * 两气成象 —— md：「命局中只有两种五行势均力敌且相生有情」。
 * 条件：只有两种五行出现 (天干+地支主气) + 两者为相生关系 (非相克)。
 */
export function isLiangQiChengXiang(ctx: Ctx): GejuHit | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    const zw = ctx.pillars.find((x) => x === p) && ganWuxing(p.hideGans[0] ?? '')
    if (zw) wxSet.add(zw)
  }
  if (wxSet.size !== 2) return null
  const [a, b] = [...wxSet]
  const GEN: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  if (GEN[a] !== b && GEN[b] !== a) return null
  const aN = ctx.ganWxCount(a) + ctx.zhiMainWxCount(a)
  const bN = ctx.ganWxCount(b) + ctx.zhiMainWxCount(b)
  if (Math.abs(aN - bN) > 2) return null
  return { name: '两气成象', note: `只见 ${a}${b} 两五行且势均相生` }
}

/**
 * 五行齐全 —— md：「八字天干地支(含藏干)中木火土金水全部出现」。
 */
export function isWuXingQiQuan(ctx: Ctx): GejuHit | null {
  const wxSet = new Set<string>()
  for (const p of ctx.pillars) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    for (const h of p.hideGans) {
      const hw = ganWuxing(h)
      if (hw) wxSet.add(hw)
    }
  }
  const WX = ['木', '火', '土', '金', '水']
  if (!WX.every((w) => wxSet.has(w))) return null
  return { name: '五行齐全', note: '木火土金水齐全' }
}

/**
 * 化气格 —— md：「日干与月干或日干与时干形成五合」
 *          「化神在月令当令或局中极旺」
 *          「化干(日主之原本五行)无根」。
 */
const HE_MAP: Record<string, { partner: string; huaWx: string }> = {
  甲: { partner: '己', huaWx: '土' }, 己: { partner: '甲', huaWx: '土' },
  乙: { partner: '庚', huaWx: '金' }, 庚: { partner: '乙', huaWx: '金' },
  丙: { partner: '辛', huaWx: '水' }, 辛: { partner: '丙', huaWx: '水' },
  丁: { partner: '壬', huaWx: '木' }, 壬: { partner: '丁', huaWx: '木' },
  戊: { partner: '癸', huaWx: '火' }, 癸: { partner: '戊', huaWx: '火' },
}
export function isHuaQiGe(ctx: Ctx): GejuHit | null {
  const info = HE_MAP[ctx.dayGan]
  if (!info) return null
  const monthGan = ctx.pillars[1].gan
  const hourGan = ctx.pillars[3].gan
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  if (ctx.rootWx(ctx.dayWx)) return null
  const monthWx = ganWuxing(ctx.pillars[1].hideGans[0] ?? '')
  const huaStrong = monthWx === info.huaWx || ctx.zhiMainWxCount(info.huaWx) >= 2
  if (!huaStrong) return null
  const sameN = ctx.pillars.filter((p) => p.gan === ctx.dayGan).length
  if (sameN > 1) return null
  return { name: '化气格', note: `${ctx.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` }
}

/** 天元一气 —— md：「年月日时四柱之干同为一字」。 */
export function isTianYuanYiQi(ctx: Ctx): GejuHit | null {
  const g = ctx.pillars[0].gan
  if (!g) return null
  if (!ctx.pillars.every((p) => p.gan === g)) return null
  return { name: '天元一气', note: `四柱天干同为 ${g}` }
}

/**
 * 日德格（依《三命通会·论日德》4 条 + 1 条魁罡破格）：
 *  1. 日柱为甲寅/丙辰/戊辰/庚辰/壬戌。
 *  2. 日德**叠见**：年/月/时柱至少再有一位日德干支。
 *  3. 日支不被冲；不落空亡（空亡暂缺 API）。
 *  4. 原局无刑破、无七杀紧贴日主、无阳刃犯。
 *  5. 原局不见相应魁罡克日德（各日德专配忌魁罡）。
 *     **【岁运相关，suiyunBreak】**：大运流年遇忌魁罡亦破，待 ctx 扩展。
 */
const RI_DE = new Set(['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'])
/** 各日德所忌魁罡（MD 条件 5 表） */
const RI_DE_FORBIDDEN_KUIGANG: Record<string, string[]> = {
  甲寅: ['庚辰'],
  丙辰: ['壬辰'],
  戊辰: ['壬戌'],       // 戊辰近魁罡结构，只注壬戌冲
  庚辰: ['庚戌', '甲寅'],
  壬戌: ['戊戌'],
}
export function isRiDeGe(ctx: Ctx): GejuHit | null {
  if (!RI_DE.has(ctx.dayGz)) return null
  const otherGzs = [
    ctx.pillars[0].gan + ctx.pillars[0].zhi,
    ctx.pillars[1].gan + ctx.pillars[1].zhi,
    ctx.pillars[3].gan + ctx.pillars[3].zhi,
  ]
  // md 条件 2: 叠见
  if (!otherGzs.some((gz) => RI_DE.has(gz))) return null
  // md 条件 3: 日支不冲
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi].includes(dzChong)) {
    return null
  }
  // md 条件 4: 无紧贴七杀
  if (ctx.tou('七杀') && (
    ctx.pillars[1].shishen === '七杀' || ctx.pillars[3].shishen === '七杀'
  )) return null
  // md 条件 5: 不犯相应魁罡
  const forbiddenKuigang = RI_DE_FORBIDDEN_KUIGANG[ctx.dayGz] ?? []
  if (otherGzs.some((gz) => forbiddenKuigang.includes(gz))) return null
  // md 条件 5 尾: "大运流年遇到亦有大灾" → 岁运敏感
  return {
    name: '日德格',
    note: `日柱 ${ctx.dayGz} · 叠见日德 · 日支不冲 · 无忌魁罡`,
    suiyunSpecific: true,
  }
}

/**
 * 日贵格（依《三命通会·论日贵》6 条必要 + 1 条岁运加重）：
 *  1. 日柱为丁亥/丁酉/癸巳/癸卯。
 *  2. 有官星（非必要，加品）。
 *  3. 官星不被冲。
 *  4. 有财生官（非必要，加品）。
 *  5. 日支贵人不被**局内**冲/合去。
 *  6. 贵人/财官不在空亡位 (ctx 无空亡 API，TODO)。
 *  7. **【岁运相关，suiyunBreak】**：大运流年冲/合/害日支贵人 → 破格。
 *     待 ctx 扩展岁运数据后在此标记 suiyunBreak=true。
 */
const RI_GUI = new Set(['丁亥', '丁酉', '癸巳', '癸卯'])
const HE_OF_RIGUI: Record<string, string> = {
  亥: '寅', 酉: '辰', 巳: '申', 卯: '戌',
}
export function isRiGuiGe(ctx: Ctx): GejuHit | null {
  if (!RI_GUI.has(ctx.dayGz)) return null
  const otherZhis = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
  // md 条件 5: 贵人日支不被冲
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && otherZhis.includes(dzChong)) return null
  // md 条件 5: 贵人日支不被"合去" (合化为他物)；简化：若合而化他——TODO 合化判断
  // 此处仅标注 "带合" 加分 (不破格)
  const heZhi = HE_OF_RIGUI[ctx.dayZhi as string]
  const hasHe = heZhi && otherZhis.includes(heZhi)
  // md 条件 7 (加重): 不遇大运流年冲破合害 → 岁运敏感
  return {
    name: '日贵格',
    note: `日柱 ${ctx.dayGz} · 贵人不冲${hasHe ? '·带合牢固' : ''}`,
    suiyunSpecific: true,
  }
}

/**
 * 身杀两停 —— md：「日主有根有扶」「七杀透干通根」「身杀旺度相当」「无官杀混杂」。
 * 采用 shenWang + 七杀通根 + 无正官，作为"力量势均"的定性近似。
 */
export function isShenShaLiangTing(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null
  if (ctx.tou('正官')) return null
  return { name: '身杀两停', note: '身旺 · 七杀透根 · 官杀不混' }
}

/**
 * 劫财见财 —— md：「劫财透干通根 + 财星透干 + 财弱于比劫 + 无官无食伤救」。
 */
export function isJieCaiJianCai(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('劫财')) return null
  if (!ctx.zang('劫财')) return null
  if (!ctx.touCat('财')) return null
  if (ctx.countCat('比劫') <= ctx.countCat('财')) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' }
}

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
