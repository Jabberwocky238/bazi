import { LU, yimaFrom, type Ctx } from '../ctx'
import type { GejuHit } from '../types'
import { SHI_SHEN_CAT } from '../types'

/**
 * 财官印全（依 md 5 条）：
 *  1. 三者均透干且通根。
 *  2. 依次相生顺流 (略，位置判定复杂)。
 *  3. 官星清纯 (正官/七杀去一留一)。
 *  4. 无伤官紧贴克官、无比劫紧贴夺财。
 *  5. 日主非极弱。
 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuHit | null {
  // md 条件 1: 三者透且通根
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  const guanTouRoot =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  const yinTouRoot =
    (ctx.tou('正印') && ctx.zang('正印')) ||
    (ctx.tou('偏印') && ctx.zang('偏印'))
  if (!caiTouRoot || !guanTouRoot || !yinTouRoot) return null
  // md 条件 3: 官杀不混
  if (ctx.tou('正官') && ctx.tou('七杀')) return null
  // md 条件 4: 伤官贴官 或 比劫贴财 则破
  if (ctx.tou('伤官') && ctx.adjacentTou('伤官', '正官')) return null
  const bijieAdjCai =
    ctx.adjacentTou('比肩', '正财') || ctx.adjacentTou('比肩', '偏财') ||
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('劫财', '偏财')
  if (bijieAdjCai) return null
  // md 条件 5: 非极弱
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return { name: '财官印全', note: '财官印三者透根、清纯无紧贴破' }
}

/** 比劫重重：比劫透干 ≥ 2 或 地支主气比劫 ≥ 3。 */
export function isBiJieChongChong(ctx: Ctx): GejuHit | null {
  const touN = [
    ctx.tou('比肩'), ctx.tou('劫财'),
  ].filter(Boolean).length +
    (ctx.pillars.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫').length
  if (touN < 2 && zhiN < 3) return null
  return { name: '比劫重重', note: `比劫透 ${touN} 位，地支主气 ${zhiN} 位` }
}

/**
 * 禄马同乡（依 md 5 条）：
 *  1. 日主禄位落于命局地支。
 *  2. 驿马字出现于命局地支。
 *  3. 禄与驿马同一地支。
 *  4. 该地支不被冲。
 *  5. 日主非极弱 ("马忌身衰")。
 */
const CHONG_PAIR: Record<string, string> = {
  子: '午', 午: '子', 卯: '酉', 酉: '卯',
  寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
  辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
}
export function isLuMaTongXiang(ctx: Ctx): GejuHit | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  const zhis = ctx.pillars.map((p) => p.zhi)
  for (let i = 0; i < ctx.pillars.length; i++) {
    const p = ctx.pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      // md 条件 4: 同乡地支不被冲
      const chong = CHONG_PAIR[p.zhi]
      if (chong && zhis.includes(chong)) continue
      // md 条件 5: 身非极弱
      if (ctx.level === '身极弱' || ctx.level === '近从弱') continue
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位，不冲身可任` }
    }
  }
  return null
}

/**
 * 以财破印：印过旺成病（印≥3位）+ 财透干通根 + 日主有其他比劫/禄刃可承担。
 * 《子平真诠》"印太多而无财以制，其人多懒惰无成"——用在印盛时，不用在身弱时。
 */
export function isYiCaiPoYin(ctx: Ctx): GejuHit | null {
  // md 条件 1: 印过旺成病
  if (ctx.countCat('印') < 3) return null
  // md 条件 2: 财透通根 + 紧贴印
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
    ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')
  if (!caiAdjYin) return null
  // md 条件 3: 身弱且无比劫 → 破印反损身
  if (ctx.shenRuo && ctx.countCat('比劫') === 0) return null
  // md 条件 4: 破印后有出口 (食伤 OR 官杀)
  if (!ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '以财破印', note: `印 ${ctx.countCat('印')} 位成病，财紧贴破印有出口` }
}

/** 财多身弱：身弱 + 财透干 ≥ 2 或 财在地支主气 ≥ 2。 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuHit | null {
  if (!ctx.shenRuo) return null
  const caiTou = ['正财', '偏财'].map((s) => ctx.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}
