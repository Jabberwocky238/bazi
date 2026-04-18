/**
 * 格局识别器。**全部采用定性判断**：
 * - 透 (某十神/五行出现在天干)
 * - 藏 (出现在地支藏干)
 * - 通根 (天干十神在地支找到根气)
 * - 得令 (月令主气生扶日主)
 * - 得地 (日支主气生扶日主)
 * - 得势 (多位支持)
 *
 * 所有阈值都是**位置数**（0-4 个柱），不做权重累加或回归比值。
 *
 * 每个 isXxx(ctx) 返回 GejuDraft | null。判定标准来自
 * public/bazi-skills/core/格局/<name>.md 的「成立条件」章节。
 */

import {
  LU,
  YANG_REN,
  WU_XING,
  TRIAD_MAP,
  triadOf,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from './store'
import { ganWuxing } from './wuxing'

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格'

export interface GejuHit {
  name: string
  note: string
  quality: GejuQuality
  category: GejuCategory
}

type GejuDraft = Pick<GejuHit, 'name' | 'note'>

const META: Record<string, { quality: GejuQuality; category: GejuCategory }> = {
  // 特殊格
  魁罡格: { quality: 'good', category: '特殊格' },
  壬骑龙背: { quality: 'good', category: '特殊格' },
  禄马同乡: { quality: 'good', category: '特殊格' },
  日照江河: { quality: 'good', category: '特殊格' },
  寒木向阳: { quality: 'good', category: '特殊格' },

  // 十神格 (吉)
  建禄格: { quality: 'good', category: '十神格' },
  官印相生: { quality: 'good', category: '十神格' },
  杀印相生: { quality: 'good', category: '十神格' },
  食神制杀: { quality: 'good', category: '十神格' },
  伤官合杀: { quality: 'good', category: '十神格' },
  伤官生财: { quality: 'good', category: '十神格' },
  伤官佩印: { quality: 'good', category: '十神格' },
  食伤泄秀: { quality: 'good', category: '十神格' },
  财官印全: { quality: 'good', category: '十神格' },
  羊刃驾杀: { quality: 'good', category: '十神格' },

  // 十神格 (凶/中性)
  官杀混杂: { quality: 'bad', category: '十神格' },
  食伤混杂: { quality: 'bad', category: '十神格' },
  伤官见官: { quality: 'bad', category: '十神格' },
  枭神夺食: { quality: 'bad', category: '十神格' },
  以财破印: { quality: 'bad', category: '十神格' },
  财多身弱: { quality: 'bad', category: '十神格' },
  比劫重重: { quality: 'bad', category: '十神格' },
  羊刃劫财: { quality: 'bad', category: '十神格' },

  // 专旺格
  曲直格: { quality: 'good', category: '专旺格' },
  炎上格: { quality: 'good', category: '专旺格' },
  稼穑格: { quality: 'good', category: '专旺格' },
  从革格: { quality: 'good', category: '专旺格' },
  润下格: { quality: 'good', category: '专旺格' },

  // 从格
  从财格: { quality: 'good', category: '从格' },
  从杀格: { quality: 'good', category: '从格' },
  弃命从势: { quality: 'good', category: '从格' },

  // 五行格 (吉)
  木火通明: { quality: 'good', category: '五行格' },
  水木清华: { quality: 'good', category: '五行格' },
  水火既济: { quality: 'good', category: '五行格' },
  土金毓秀: { quality: 'good', category: '五行格' },
  金火铸印: { quality: 'good', category: '五行格' },
  金白水清: { quality: 'good', category: '五行格' },
  火土夹带: { quality: 'good', category: '五行格' },
  木疏厚土: { quality: 'good', category: '五行格' },
  斧斤伐木: { quality: 'good', category: '五行格' },

  // 五行格 (凶)
  木火相煎: { quality: 'bad', category: '五行格' },
  木多火塞: { quality: 'bad', category: '五行格' },
  水火相战: { quality: 'bad', category: '五行格' },
  水多木漂: { quality: 'bad', category: '五行格' },
  水冷木寒: { quality: 'bad', category: '五行格' },
  金寒水冷: { quality: 'bad', category: '五行格' },
  火旺金衰: { quality: 'bad', category: '五行格' },
  火多金熔: { quality: 'bad', category: '五行格' },
  火炎土燥: { quality: 'bad', category: '五行格' },
  土重金埋: { quality: 'bad', category: '五行格' },
}

type ShishenCat = '比劫' | '印' | '食伤' | '财' | '官杀'

const SHI_SHEN_CAT: Record<string, ShishenCat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

const WX_GENERATED_BY: Record<string, string> = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' }
const WX_CONTROLLED_BY: Record<string, string> = { 土: '木', 水: '土', 火: '水', 金: '火', 木: '金' }
const WX_CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

const SEASON_BY_ZHI: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_MAP[triadOf(zhi as Zhi)]['驿马']
  } catch {
    return undefined
  }
}

interface Ctx {
  pillars: Pillar[]
  dayGan: Gan
  dayZhi: Zhi
  dayGz: string
  monthZhi: Zhi
  yearZhi: Zhi
  dayWx: string
  season: '春' | '夏' | '秋' | '冬' | ''
  /** 日主阳干 (甲/丙/戊/庚/壬) */
  dayYang: boolean

  // —— 十神定性查询 ——
  tou(s: string): boolean
  touCat(c: ShishenCat): boolean
  zang(s: string): boolean
  has(s: string): boolean
  hasCat(c: ShishenCat): boolean
  mainAt(s: string): number[]
  strong(s: string): boolean
  strongCat(c: ShishenCat): boolean

  // —— 数量统计 (干位 + 所有藏干位) ——
  /** 某十神总位数 (年月时干 + 四柱所有藏干) */
  countOf(s: string): number
  /** 某类别总位数 */
  countCat(c: ShishenCat): number

  // —— 五行定性查询 (按"柱数"计数) ——
  ganWxCount(wx: string): number
  zhiMainWxCount(wx: string): number
  touWx(wx: string): boolean
  rootWx(wx: string): boolean

  // —— 日主强弱 ——
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean
  /** 比劫 + 印在四柱 (干位 + 主气) 的总位数 */
  selfSupportN: number

  // —— 位置关系 ——
  adjacentTou(s1: string, s2: string): boolean

  // —— 月令类别 ——
  monthCat: ShishenCat | ''
}

function buildCtx(pillars: Pillar[]): Ctx {
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.gan as Gan
  const dayWx = WU_XING[dayGan] ?? ganWuxing(dayGan)
  const season = SEASON_BY_ZHI[monthP.zhi as string] ?? ''

  // 年/月/时干十神 (排除日干)
  const ganSs = [yearP.shishen, monthP.shishen, hourP.shishen].filter(
    (s) => s && s !== '日主',
  )
  const ganSet = new Set(ganSs)

  // 四柱地支主气十神 (含日支)
  const mainZhi = pillars.map((p) => p.hideShishen[0] ?? '')
  // 所有藏干十神
  const allZhi = pillars.flatMap((p) => p.hideShishen)

  const monthCat = (SHI_SHEN_CAT[mainZhi[1]] ?? '') as ShishenCat | ''
  const dayZhiCat = (SHI_SHEN_CAT[mainZhi[2]] ?? '') as ShishenCat | ''

  // —— 日主强弱定性 ——
  const isSelfOrYin = (cat: ShishenCat | '') => cat === '比劫' || cat === '印'
  const deLing = isSelfOrYin(monthCat)
  const deDi = isSelfOrYin(dayZhiCat)
  // 得势: 三干 (年/月/时) + 四支主气 共 7 位, 生扶 ≥ 3
  let support = 0
  for (const s of ganSs) if (isSelfOrYin(SHI_SHEN_CAT[s])) support++
  for (let i = 0; i < 4; i++) {
    // 主气已包含日支, 一并计入
    if (isSelfOrYin(SHI_SHEN_CAT[mainZhi[i]])) support++
  }
  const deShi = support >= 3
  const numDe = [deLing, deDi, deShi].filter(Boolean).length
  const shenWang = numDe >= 2
  const shenRuo = numDe === 0

  // —— 查询 helpers ——
  const tou = (s: string) => ganSet.has(s)
  const touCat = (c: ShishenCat) => ganSs.some((s) => SHI_SHEN_CAT[s] === c)
  const zang = (s: string) => allZhi.includes(s)
  const has = (s: string) => ganSet.has(s) || allZhi.includes(s)
  const hasCat = (c: ShishenCat) =>
    ganSs.some((s) => SHI_SHEN_CAT[s] === c) ||
    allZhi.some((s) => SHI_SHEN_CAT[s] === c)
  const mainAt = (s: string) => {
    const out: number[] = []
    mainZhi.forEach((x, i) => {
      if (x === s) out.push(i)
    })
    return out
  }
  const strong = (s: string) => tou(s) || mainAt(s).length > 0
  const strongCat = (c: ShishenCat) =>
    pillars.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen] === c) return true
      return SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === c
    })

  // 数量统计：天干 3 位 + 四柱所有藏干
  const countOf = (s: string) => {
    let n = 0
    for (const g of ganSs) if (g === s) n++
    for (const z of allZhi) if (z === s) n++
    return n
  }
  const countCat = (c: ShishenCat) => {
    let n = 0
    for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of allZhi) if (SHI_SHEN_CAT[z] === c) n++
    return n
  }

  const ganWxCount = (wx: string) =>
    pillars.filter((p) => ganWuxing(p.gan) === wx).length
  const zhiMainWxCount = (wx: string) =>
    pillars.filter((p) => {
      const g = p.hideGans[0]
      return g && ganWuxing(g) === wx
    }).length
  const touWx = (wx: string) =>
    pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
  const rootWx = (wx: string) => zhiMainWxCount(wx) > 0

  // 天干位置 (0=年 1=月 3=时) — 不含日柱
  const ganPosOf = (s: string): number[] => {
    const out: number[] = []
    if (pillars[0].shishen === s) out.push(0)
    if (pillars[1].shishen === s) out.push(1)
    if (pillars[3].shishen === s) out.push(3)
    return out
  }
  const adjacentTou = (s1: string, s2: string) => {
    const p1 = ganPosOf(s1)
    const p2 = ganPosOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    // 日柱位2, 若 s1或s2 落在邻柱, 考虑与日柱邻接
    return false
  }

  const dayYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)
  // 比劫 + 印总位数 (天干 + 四柱主气)，用于身弱/身旺细分
  let selfSupportN = 0
  for (const g of ganSs) if (isSelfOrYin(SHI_SHEN_CAT[g])) selfSupportN++
  for (let i = 0; i < 4; i++) if (isSelfOrYin(SHI_SHEN_CAT[mainZhi[i]])) selfSupportN++

  return {
    pillars,
    dayGan,
    dayZhi: dayP.zhi as Zhi,
    dayGz: dayP.gz,
    monthZhi: monthP.zhi as Zhi,
    yearZhi: yearP.zhi as Zhi,
    dayWx,
    season,
    dayYang,
    tou, touCat, zang, has, hasCat, mainAt, strong, strongCat,
    countOf, countCat,
    ganWxCount, zhiMainWxCount, touWx, rootWx,
    deLing, deDi, deShi, shenWang, shenRuo,
    selfSupportN,
    adjacentTou,
    monthCat,
  }
}

// ——————————————————————— 正格 ———————————————————————

/**
 * 建禄格：月支本气为日主之禄 + 原局有官/财/食伤作为泄克出口。
 * 依《子平真诠》："禄格用官，干头透出为奇；其次财生官，其次伤官佩印……
 *   日元既旺，则宜泄宜克"。无泄克出口者只是"空身强"，不入贵格。
 */
export function isJianLuGe(ctx: Ctx): GejuDraft | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  const hasOutlet =
    ctx.touCat('官杀') || ctx.touCat('财') || ctx.touCat('食伤')
  if (!hasOutlet) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官杀/财/食伤为用`,
  }
}

/**
 * 魁罡格：日柱为四魁罡 + 身旺 + 原局无财透紧贴日柱。
 * 《三命通会》"身强遇之转荣华，运见财官禄科尽丧"。身弱或财紧贴者破格。
 */
export function isKuiGangGe(ctx: Ctx): GejuDraft | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (ctx.shenRuo) return null
  // 月干/时干有财透 = 财紧贴日柱
  const adjCai =
    SHI_SHEN_CAT[ctx.pillars[1].shishen] === '财' ||
    SHI_SHEN_CAT[ctx.pillars[3].shishen] === '财'
  if (adjCai) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡，身强不犯财官` }
}

/**
 * 壬骑龙背：日柱壬辰 + 再见壬或辰（多壬多辰为贵）+ 辰不被戌冲。
 * 《三命通会》"壬骑龙背，所喜者多壬、多辰"；md 条件 2 要求其他柱再见壬或辰，
 * 仅日柱壬辰降为"一般壬坐辰"不入真格。
 */
export function isRenQiLongBei(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGz !== '壬辰') return null
  // 条件 2：年/月/时 再见壬 或 再见辰
  const otherRen = [ctx.pillars[0], ctx.pillars[1], ctx.pillars[3]]
    .some((p) => p.gan === '壬')
  const otherChen = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
    .includes('辰')
  if (!otherRen && !otherChen) return null
  // 条件 3：辰不被戌冲
  const hasXu = ctx.pillars.some((p) => p.zhi === '戌')
  if (hasXu) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '，再透壬' : ''}${otherChen ? '，再见辰' : ''}`,
  }
}

// ——————————————————————— 官杀 ———————————————————————

/** 官杀混杂：正官与七杀同时存在 (天干或地支)。 */
export function isGuanShaHunZa(ctx: Ctx): GejuDraft | null {
  if (!ctx.has('正官') || !ctx.has('七杀')) return null
  const form = ctx.tou('正官') && ctx.tou('七杀') ? '天干双透'
    : ctx.tou('正官') || ctx.tou('七杀') ? '一透一藏' : '均藏'
  return { name: '官杀混杂', note: `正官 + 七杀 ${form}` }
}

/**
 * 官印相生：正官透干 + 印透干 + 无七杀透（藏支可容） + 无伤官透 + 无财紧贴破印。
 */
export function isGuanYinXiangSheng(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('正官')) return null
  if (ctx.tou('七杀')) return null        // 放宽：允许七杀藏支
  if (!ctx.touCat('印')) return null
  if (ctx.tou('伤官')) return null
  // 财紧贴印则破印
  if (ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
      ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')) return null
  return { name: '官印相生', note: '正官透印透，无伤官与紧贴财破格' }
}

/**
 * 杀印相生：七杀透干或月令七杀 + 印透干。
 * 允许正官藏支（不透则不算混杂）。
 *
 * 互斥条件：**伤官合杀成立时七杀已被合去，无杀可化**。
 * 依《子平真诠·论七杀》"杀用印则不用食伤，杀用食伤则不用印"——
 * 七杀用神排他；《子平真诠·论伤官》"合杀者，取其合以去杀"——
 * 合后杀已不独立存在，不能再论相生。
 */
export function isShaYinXiangSheng(ctx: Ctx): GejuDraft | null {
  const shaPresent = ctx.tou('七杀') || ctx.monthCat === '官杀'
  if (!shaPresent) return null
  if (ctx.tou('正官')) return null
  if (!ctx.touCat('印')) return null
  // 伤官合杀互斥：阴日主 + 伤官与七杀紧贴双透 → 杀已合去，返 null
  if (!ctx.dayYang && ctx.tou('伤官') && ctx.tou('七杀') &&
      ctx.adjacentTou('伤官', '七杀')) {
    return null
  }
  return { name: '杀印相生', note: '七杀配印，化杀生身' }
}

// ——————————————————————— 食伤 ———————————————————————

/**
 * 食神制杀：月令七杀或七杀透干通根 + 食神透干通根 + 无枭印夺食。
 * 放宽：不再强求身不弱（食杀两停即可），但偏印透则破。
 */
export function isShiShenZhiSha(ctx: Ctx): GejuDraft | null {
  const shaPresent = ctx.tou('七杀') || ctx.monthCat === '官杀' || ctx.zang('七杀')
  if (!shaPresent) return null
  if (!ctx.tou('食神')) return null
  // 食神需通根 (主气或藏干)
  if (!ctx.zang('食神')) return null
  if (ctx.tou('偏印')) return null
  return { name: '食神制杀', note: '食神透干通根，制七杀' }
}

/**
 * 枭神夺食：偏印透 + 食神存在 + 无财救 + 无伤官夺命（月令伤官且伤官透干则本格为伤官佩印）。
 * 互斥：月令伤官 + 伤官透干 → 结构为伤官格，偏印作佩印用，不作枭印夺食论。
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  // 月令伤官且伤官透干 → 本格为伤官格 + 偏印佩印，非枭神夺食
  if (ctx.mainAt('伤官').includes(1) && ctx.tou('伤官')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}

/** 伤官见官：伤官与正官都透干 + 相邻 + 无印制(印不透)。 */
export function isShangGuanJianGuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  return { name: '伤官见官', note: '伤官正官紧贴且无救' }
}

/**
 * 伤官合杀：日主为阴干 + 伤官与七杀**都透干** + 位置紧贴（相邻柱）。
 * 《渊海子平》：五合只在天干，阳干无此结构。
 * 《滴天髓·通神论》"合之力以紧贴为真"——年/时遥合作不成真合。
 */
export function isShangGuanHeSha(ctx: Ctx): GejuDraft | null {
  if (ctx.dayYang) return null
  if (!ctx.tou('伤官') || !ctx.tou('七杀')) return null
  if (!ctx.adjacentTou('伤官', '七杀')) return null  // 紧贴才真合
  return { name: '伤官合杀', note: `阴日主 ${ctx.dayGan} 伤官七杀紧贴双透五合` }
}

/** 伤官生财：伤官透 + 财有力 + 身不弱 + 印不透(以免克伤)。 */
export function isShangGuanShengCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.strongCat('财')) return null
  if (ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '伤官生财', note: '伤官透生财，无印阻' }
}

/**
 * 伤官佩印：伤官透干通根 + 印透干通根 + **身弱**（专为身弱用印） + 财不透破印。
 * 《子平真诠》"伤官用印，身弱有力"。身旺用财，身弱用印 —— 这里限身弱。
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuDraft | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null                 // 伤官通根
  if (!ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null                  // 财透破印
  if (ctx.shenWang) return null                      // 身旺则不用印而应用财
  return { name: '伤官佩印', note: '身弱伤官透，印透制伤化气' }
}

/** 食伤混杂：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuDraft | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}

/** 食伤泄秀：身旺 + 食伤透干 + 无偏印透(避免夺食)。 */
export function isShiShangXieXiu(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenWang) return null
  if (!(ctx.tou('食神') || ctx.tou('伤官'))) return null
  if (ctx.tou('偏印')) return null
  return { name: '食伤泄秀', note: '身旺见食伤透泄秀' }
}

// ——————————————————————— 羊刃 ———————————————————————

/**
 * 羊刃驾杀：日主阳干 + 刃位见于月/日/时支 + 七杀透干通根。
 * 《子平真诠》"羊刃无杀不足为贵；七杀无刃不足为威"。刃杀势均方成贵格。
 */
export function isYangRenJiaSha(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.tou('七杀')) return null
  return { name: '羊刃驾杀', note: `阳刃 ${yr} 见于支 + 七杀透干` }
}

/**
 * 羊刃劫财：阳干 + 刃位见于月/日/时支 + 劫财透或通根多位。
 */
export function isYangRenJieCai(ctx: Ctx): GejuDraft | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.has('劫财')) return null
  return { name: '羊刃劫财', note: `阳刃 ${yr} 见于支 + 劫财并显` }
}

// ——————————————————————— 总量 ———————————————————————

/** 财官印全：财、官(杀)、印 三者皆透干。 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuDraft | null {
  if (!ctx.touCat('财')) return null
  if (!ctx.touCat('官杀')) return null
  if (!ctx.touCat('印')) return null
  return { name: '财官印全', note: '财官印三者透干' }
}

/** 比劫重重：比劫透干 ≥ 2 或 地支主气比劫 ≥ 3。 */
export function isBiJieChongChong(ctx: Ctx): GejuDraft | null {
  const touN = [
    ctx.tou('比肩'), ctx.tou('劫财'),
  ].filter(Boolean).length +
    (ctx.pillars.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫').length
  if (touN < 2 && zhiN < 3) return null
  return { name: '比劫重重', note: `比劫透 ${touN} 位，地支主气 ${zhiN} 位` }
}

/** 禄马同乡：某柱地支既为日主禄又为驿马。 */
export function isLuMaTongXiang(ctx: Ctx): GejuDraft | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  for (let i = 0; i < ctx.pillars.length; i++) {
    const p = ctx.pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位` }
    }
  }
  return null
}

/**
 * 以财破印：印过旺成病（印≥3位）+ 财透干通根 + 日主有其他比劫/禄刃可承担。
 * 《子平真诠》"印太多而无财以制，其人多懒惰无成"——用在印盛时，不用在身弱时。
 */
export function isYiCaiPoYin(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('印') < 3) return null            // 印需成病 (≥3位)
  if (!ctx.touCat('财')) return null
  if (!ctx.zang('正财') && !ctx.zang('偏财')) return null  // 财通根
  // 身弱且无比劫支撑 → 破印反损身
  if (ctx.shenRuo && ctx.countCat('比劫') === 0) return null
  return { name: '以财破印', note: `印 ${ctx.countCat('印')} 位成病，财透破印` }
}

/** 财多身弱：身弱 + 财透干 ≥ 2 或 财在地支主气 ≥ 2。 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuDraft | null {
  if (!ctx.shenRuo) return null
  const caiTou = ['正财', '偏财'].map((s) => ctx.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = ctx.pillars.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}

// ——————————————————————— 五行象法 · 成对判定 ———————————————————————
/*
 * 五行象法按"两五行对关系"分组。每对 judge 函数返回**至多一个**名号,
 * 同一对内的不同子格天然互斥 (定性分支决定落在哪个子格)。
 */

/** 水火对：既济 (有通关) / 相战 (无通关)。*/
export function judgeShuiHuo(ctx: Ctx): GejuDraft | null {
  if (!ctx.touWx('水') || !ctx.touWx('火')) return null
  const tongGuan = ctx.touWx('木') || ctx.touWx('土')
  if (tongGuan) return { name: '水火既济', note: '水火并存，有木/土通关' }
  return { name: '水火相战', note: '水火并透，无木/土通关' }
}

/** 木火对：
 *  - 木日主 + 火过旺 + 木无重根 + 无水救 → 木火相煎
 *  - 木日主 + 火透 + 木有根 + 无金克 → 木火通明
 *  - 火日主 + 地支木 ≥ 3 + 火无重根 → 木多火塞
 */
export function judgeMuHuo(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx === '木') {
    const huoMany = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
    const muRootCount = ctx.zhiMainWxCount('木')
    const hasShui = ctx.touWx('水') || ctx.rootWx('水')
    if (huoMany && muRootCount <= 1 && !hasShui) {
      return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
    }
    if (ctx.touWx('火') && ctx.rootWx('木') && !ctx.touWx('金')) {
      return { name: '木火通明', note: '木生火且火透，无金克木' }
    }
  }
  if (ctx.dayWx === '火') {
    const muMany = ctx.zhiMainWxCount('木') >= 3
    const huoStrong = ctx.rootWx('火') && ctx.zhiMainWxCount('火') >= 2
    if (muMany && !huoStrong) {
      return { name: '木多火塞', note: '木多压火且火无重根' }
    }
  }
  return null
}

/** 土金对：
 *  - 土日主 + 金透 + 土有根 + 无木透 → 土金毓秀
 *  - 金日主 + 地支土 ≥ 3 + 土透 ≥ 2 → 土重金埋
 */
export function judgeTuJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx === '土') {
    if (ctx.touWx('金') && ctx.rootWx('土') && !ctx.touWx('木')) {
      return { name: '土金毓秀', note: '土生金且金透，无木克土' }
    }
  }
  if (ctx.dayWx === '金') {
    if (ctx.zhiMainWxCount('土') >= 3 && ctx.ganWxCount('土') >= 2) {
      return { name: '土重金埋', note: '地支土 ≥ 3 位压金' }
    }
  }
  return null
}

/** 火金对 (日主金)：
 *  - 火过盛 + 金无根 + 无水救 → 火多金熔
 *  - 火透 ≥ 2 + 金无根 → 火旺金衰
 *  - 金有根 + 火透 → 金火铸印
 */
export function judgeHuoJin(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '金') return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 && ctx.zhiMainWxCount('火') >= 1
  const huoDuo = ctx.ganWxCount('火') >= 2
  const jinRoot = ctx.rootWx('金')
  const huoTou = ctx.touWx('火')
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  if (huoHeavy && !jinRoot && !hasShui) {
    return { name: '火多金熔', note: '火极盛金无根且无水救' }
  }
  if (huoDuo && !jinRoot) return { name: '火旺金衰', note: '火多透而金无根' }
  if (jinRoot && huoTou) return { name: '金火铸印', note: '金有根得火锻' }
  return null
}

/** 火土对：
 *  - 火土皆透 + 有根 + 有水调湿 → 火土夹带 (吉)
 *  - 火过旺 + 土随火烤 + 无水 → 火炎土燥 (凶)
 */
export function judgeHuoTu(ctx: Ctx): GejuDraft | null {
  const huoTou = ctx.touWx('火')
  const tuTou = ctx.touWx('土')
  if (!huoTou || !tuTou) return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  if (huoHeavy && !hasShui) {
    return { name: '火炎土燥', note: '火旺透土而无水润' }
  }
  if (ctx.rootWx('火') && ctx.rootWx('土') && hasShui) {
    return { name: '火土夹带', note: '火土相连有根且水润' }
  }
  return null
}

/** 水木对 (日主水或木)：
 *  - 木日主 + 水极盛 + 木无根 → 水多木漂 (凶)
 *  - 木日主 + 冬月 + 水多 + 无火 → 水冷木寒 (凶)
 *  - 水透 + 木透 + 无金透 + 无厚土克水 → 水木清华 (吉)
 */
export function judgeShuiMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null

  if (ctx.dayWx === '木') {
    const shuiMany = ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 3
    const muRootless = ctx.zhiMainWxCount('木') === 0
    if (shuiMany && muRootless) {
      return { name: '水多木漂', note: '水盛而木无根' }
    }
    if (
      ctx.season === '冬' &&
      (ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 2) &&
      !ctx.touWx('火')
    ) {
      return { name: '水冷木寒', note: '冬月水旺而无火' }
    }
  }

  if (!ctx.touWx('水') || !ctx.touWx('木')) return null
  if (ctx.touWx('金')) return null
  if (ctx.zhiMainWxCount('土') >= 2) return null
  return { name: '水木清华', note: '水生木且木透，无金克' }
}

/** 金水对：
 *  - 冬月 + 金水齐透 + 无火透 → 金寒水冷 (凶)
 *  - 金日主 + 水透 + 金有根 + 无厚土掩 + 非冬 → 金白水清 (吉)
 */
export function judgeJinShui(ctx: Ctx): GejuDraft | null {
  if (
    ctx.season === '冬' &&
    (ctx.dayWx === '金' || ctx.dayWx === '水') &&
    ctx.touWx('金') && ctx.touWx('水') &&
    !ctx.touWx('火')
  ) {
    return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
  }
  if (
    ctx.dayWx === '金' &&
    ctx.touWx('水') &&
    ctx.rootWx('金') &&
    ctx.zhiMainWxCount('土') < 2 &&
    ctx.season !== '冬'
  ) {
    return { name: '金白水清', note: '金有根透水，无土浊水' }
  }
  return null
}

/** 木土对 (日主土)：地支土 ≥ 2 + 天干木恰 1 位 → 木疏厚土。*/
export function judgeMuTu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  if (ctx.zhiMainWxCount('土') < 2) return null
  if (ctx.ganWxCount('木') !== 1) return null
  return { name: '木疏厚土', note: '厚土得一木疏之' }
}

/** 金木对 (日主木)：金透 ≥ 2 或 地支金 ≥ 2 → 斧斤伐木。*/
export function judgeJinMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.ganWxCount('金') < 2 && ctx.zhiMainWxCount('金') < 2) return null
  return { name: '斧斤伐木', note: '金旺克木' }
}

/** 调候：冬月木日主 + 火透 → 寒木向阳。*/
export function judgeHanMu(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null
  return { name: '寒木向阳', note: '冬木见火调候' }
}

/** 特殊：丙日主 + 水透 → 日照江河。*/
export function judgeRiZhao(ctx: Ctx): GejuDraft | null {
  if (ctx.dayGan !== '丙') return null
  if (!ctx.touWx('水')) return null
  return { name: '日照江河', note: '丙火照水' }
}

// ——————————————————————— 专旺 ———————————————————————

/**
 * 专旺共用判据 (定性)：
 * - 日主属 targetWx
 * - 月令主气为日主同类或印
 * - 地支 (同类+印) 主气 ≥ 3
 * - 无官杀透 (克星一透即破，依《渊海子平》"无 X 相克"铁律)
 * - 财透位数 ≤ maxCaiTou (默认 ∞，稼穑另传 1 位)
 *
 * 曲直/炎上/从革/润下 md 均未把财透列为破条件 — 只忌官杀。
 * 稼穑 md 条件 5 明列"水多冲土"，一位有根可容，二位以上破。
 */
function checkZhuanWang(
  ctx: Ctx,
  targetWx: string,
  maxCaiTou = Infinity,
): { note: string } | null {
  if (ctx.dayWx !== targetWx) return null
  if (!ctx.deLing) return null
  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx]
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  const caiTouN =
    (ctx.tou('正财') ? 1 : 0) + (ctx.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  return {
    note: `地支 ${selfWx}+${yinWx} ${supportZhi} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '火')
  return r ? { name: '炎上格', note: r.note } : null
}
/** 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。 */
export function isJiaSeGe(ctx: Ctx): GejuDraft | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuDraft | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}

// ——————————————————————— 从格 ———————————————————————

/**
 * 从X 共用判据（依《滴天髓》"若有一毫印绶，即不为从"）：
 * - 日主**无任何比劫 / 印根**（天干无比印透，四柱藏干无比印）
 * - 月令为目标类别 OR 目标在地支主气 ≥ 3
 * - 目标类别透干
 */
function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (!ctx.touCat(target)) return null
  const monthIs = ctx.monthCat === target
  const zhiSupport = ctx.zhiMainWxCount(targetWx)
  if (!monthIs && zhiSupport < 3) return null
  return {
    note: `日主无根 (0 比劫印)，${monthIs ? `月令${target}` : `地支 ${targetWx} ${zhiSupport} 位`}`,
  }
}

/** 从财格：身极弱 + 从财。 */
export function isCongCaiGe(ctx: Ctx): GejuDraft | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  return r ? { name: '从财格', note: r.note } : null
}

/** 从杀格：身极弱 + 从官杀。 */
export function isCongShaGe(ctx: Ctx): GejuDraft | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  return r ? { name: '从杀格', note: r.note } : null
}

/**
 * 弃命从势：日主无任何比劫/印根 + 食伤、财、官杀中至少两类并强透干。
 * 《滴天髓·从象》任铁樵注："日主孤立无根，四柱财官食伤势均力敌"。
 */
export function isQiMingCongShi(ctx: Ctx): GejuDraft | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  const strongCats = (['食伤', '财', '官杀'] as ShishenCat[]).filter(
    (c) => ctx.touCat(c) && ctx.countCat(c) >= 2,
  )
  if (strongCats.length < 2) return null
  return { name: '弃命从势', note: `无根 + ${strongCats.join(' ')} 并强` }
}

// ——————————————————————— 主入口 ———————————————————————

export const DETECTORS: Record<string, (ctx: Ctx) => GejuDraft | null> = {
  // 正格
  建禄格: isJianLuGe,
  魁罡格: isKuiGangGe,
  壬骑龙背: isRenQiLongBei,
  // 官杀
  官杀混杂: isGuanShaHunZa,
  官印相生: isGuanYinXiangSheng,
  杀印相生: isShaYinXiangSheng,
  // 食伤
  食神制杀: isShiShenZhiSha,
  枭神夺食: isXiaoShenDuoShi,
  伤官见官: isShangGuanJianGuan,
  伤官合杀: isShangGuanHeSha,
  伤官生财: isShangGuanShengCai,
  伤官佩印: isShangGuanPeiYin,
  食伤混杂: isShiShangHunZa,
  食伤泄秀: isShiShangXieXiu,
  // 羊刃
  羊刃驾杀: isYangRenJiaSha,
  羊刃劫财: isYangRenJieCai,
  // 总量
  财官印全: isCaiGuanYinQuan,
  比劫重重: isBiJieChongChong,
  禄马同乡: isLuMaTongXiang,
  以财破印: isYiCaiPoYin,
  财多身弱: isCaiDuoShenRuo,
  // 五行象法 (成对判定，key 为对关系标识)
  水火对: judgeShuiHuo,   // → 水火既济 / 水火相战
  木火对: judgeMuHuo,     // → 木火相煎 / 木火通明 / 木多火塞
  土金对: judgeTuJin,     // → 土金毓秀 / 土重金埋
  火金对: judgeHuoJin,    // → 火多金熔 / 火旺金衰 / 金火铸印
  火土对: judgeHuoTu,     // → 火土夹带 / 火炎土燥
  水木对: judgeShuiMu,    // → 水木清华 / 水多木漂 / 水冷木寒
  金水对: judgeJinShui,   // → 金寒水冷 / 金白水清
  木土对: judgeMuTu,      // → 木疏厚土
  金木对: judgeJinMu,     // → 斧斤伐木
  寒木向阳: judgeHanMu,
  日照江河: judgeRiZhao,
  // 专旺 (五行分五格)
  曲直格: isQuZhiGe,
  炎上格: isYanShangGe,
  稼穑格: isJiaSeGe,
  从革格: isCongGeGe,
  润下格: isRunXiaGe,
  // 从格
  从财格: isCongCaiGe,
  从杀格: isCongShaGe,
  弃命从势: isQiMingCongShi,
}

function enrich(d: GejuDraft): GejuHit {
  const m = META[d.name] ?? { quality: 'neutral' as const, category: '特殊格' as const }
  return { ...d, quality: m.quality, category: m.category }
}

export function detectGeju(pillars: Pillar[]): GejuHit[] {
  if (pillars.length !== 4) return []
  const ctx = buildCtx(pillars)
  const hits: GejuHit[] = []
  for (const detect of Object.values(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push(enrich(h))
  }
  return hits
}
