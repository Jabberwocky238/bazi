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
 * 每个 isXxx(ctx) 返回 GejuHit | null。判定标准来自
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

export interface GejuHit {
  name: string
  note: string
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

  // —— 十神定性查询 ——
  /** 十神在年/月/时干任意透出 */
  tou(s: string): boolean
  /** 类别是否有任一十神透干 */
  touCat(c: ShishenCat): boolean
  /** 十神在任意地支藏干出现 */
  zang(s: string): boolean
  /** 十神透干或藏干 */
  has(s: string): boolean
  /** 类别透干或藏干 */
  hasCat(c: ShishenCat): boolean
  /** 某柱地支主气为该十神的柱号列表 (0=年 1=月 2=日 3=时) */
  mainAt(s: string): number[]
  /** 十神"有力" = 透干 或 任一柱地支主气即此 */
  strong(s: string): boolean
  /** 类别"有力" */
  strongCat(c: ShishenCat): boolean

  // —— 五行定性查询 (按"柱数"计数, 非加权) ——
  /** 年/月/日/时干中此五行的柱数 0-4 */
  ganWxCount(wx: string): number
  /** 年/月/日/时支主气中此五行的柱数 0-4 */
  zhiMainWxCount(wx: string): number
  /** 该五行在天干透出 */
  touWx(wx: string): boolean
  /** 该五行在地支主气有根 */
  rootWx(wx: string): boolean

  // —— 日主强弱 (定性) ——
  /** 月令主气生扶日主 (同类或印) */
  deLing: boolean
  /** 日支主气生扶日主 */
  deDi: boolean
  /** 除日干外其余 7 位 (三干+四主气) 中生扶日主 ≥ 3 */
  deShi: boolean
  /** 身旺: 三者得 ≥ 2 */
  shenWang: boolean
  /** 身弱: 三者皆不得 */
  shenRuo: boolean

  // —— 位置关系 ——
  /** 十神 s1 与 s2 是否在相邻天干柱 (伤官见官之"紧贴") */
  adjacentTou(s1: string, s2: string): boolean

  // —— 月令类别 (便于 raw check) ——
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

  return {
    pillars,
    dayGan,
    dayZhi: dayP.zhi as Zhi,
    dayGz: dayP.gz,
    monthZhi: monthP.zhi as Zhi,
    yearZhi: yearP.zhi as Zhi,
    dayWx,
    season,
    tou, touCat, zang, has, hasCat, mainAt, strong, strongCat,
    ganWxCount, zhiMainWxCount, touWx, rootWx,
    deLing, deDi, deShi, shenWang, shenRuo,
    adjacentTou,
    monthCat,
  }
}

// ——————————————————————— 正格 ———————————————————————

/** 建禄格：月支为日主之禄。 */
export function isJianLuGe(ctx: Ctx): GejuHit | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  return { name: '建禄格', note: `月令 ${ctx.monthZhi} 为日主 ${ctx.dayGan} 之禄` }
}

/** 魁罡格：日柱为庚辰/庚戌/壬辰/戊戌。 */
export function isKuiGangGe(ctx: Ctx): GejuHit | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 为魁罡` }
}

/** 壬骑龙背：日柱壬辰。 */
export function isRenQiLongBei(ctx: Ctx): GejuHit | null {
  if (ctx.dayGz !== '壬辰') return null
  return { name: '壬骑龙背', note: '日柱壬辰' }
}

// ——————————————————————— 官杀 ———————————————————————

/** 官杀混杂：正官与七杀同时存在 (天干或地支)。 */
export function isGuanShaHunZa(ctx: Ctx): GejuHit | null {
  if (!ctx.has('正官') || !ctx.has('七杀')) return null
  const form = ctx.tou('正官') && ctx.tou('七杀') ? '天干双透'
    : ctx.tou('正官') || ctx.tou('七杀') ? '一透一藏' : '均藏'
  return { name: '官杀混杂', note: `正官 + 七杀 ${form}` }
}

/** 官印相生：正官存在 + 无七杀(否则为混杂) + 印透干 + 无伤官透 + 身不弱。 */
export function isGuanYinXiangSheng(ctx: Ctx): GejuHit | null {
  if (!ctx.has('正官')) return null
  if (ctx.has('七杀')) return null
  if (!ctx.touCat('印')) return null
  if (ctx.tou('伤官')) return null
  if (ctx.shenRuo) return null
  return { name: '官印相生', note: '正官配印，无伤官混迹' }
}

/** 杀印相生：七杀存在 + 无正官(否则为混杂) + 印透干 + 身不弱。 */
export function isShaYinXiangSheng(ctx: Ctx): GejuHit | null {
  if (!ctx.has('七杀')) return null
  if (ctx.has('正官')) return null
  if (!ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '杀印相生', note: '七杀配印，身不弱' }
}

// ——————————————————————— 食伤 ———————————————————————

/** 食神制杀：食神透 + 七杀存在 + **无偏印透干**(枭印夺食) + 身不弱。 */
export function isShiShenZhiSha(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('食神')) return null
  if (!ctx.has('七杀')) return null
  if (ctx.tou('偏印')) return null
  if (ctx.shenRuo) return null
  return { name: '食神制杀', note: '食神透干制七杀' }
}

/** 枭神夺食：偏印透 + 食神存在 + 无财救(财不透)。 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}

/** 伤官见官：伤官与正官都透干 + 相邻 + 无印制(印不透)。 */
export function isShangGuanJianGuan(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  return { name: '伤官见官', note: '伤官正官紧贴且无救' }
}

/** 伤官合杀：伤官与七杀并存。 */
export function isShangGuanHeSha(ctx: Ctx): GejuHit | null {
  if (!ctx.has('伤官') || !ctx.has('七杀')) return null
  return { name: '伤官合杀', note: '伤官 + 七杀共存' }
}

/** 伤官生财：伤官透 + 财有力 + 身不弱 + 印不透(以免克伤)。 */
export function isShangGuanShengCai(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.strongCat('财')) return null
  if (ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '伤官生财', note: '伤官透生财，无印阻' }
}

/** 伤官佩印：伤官透 + 印透 + 身不弱 + 财不透(以免破印)。 */
export function isShangGuanPeiYin(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('伤官')) return null
  if (!ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  if (ctx.shenRuo) return null
  return { name: '伤官佩印', note: '伤官佩印，无财破印' }
}

/** 食伤混杂：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuHit | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}

/** 食伤泄秀：身旺 + 食伤透干 + 无偏印透(避免夺食)。 */
export function isShiShangXieXiu(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  if (!(ctx.tou('食神') || ctx.tou('伤官'))) return null
  if (ctx.tou('偏印')) return null
  return { name: '食伤泄秀', note: '身旺见食伤透泄秀' }
}

// ——————————————————————— 羊刃 ———————————————————————

/** 羊刃驾杀：月支为日主羊刃 + 七杀存在。 */
export function isYangRenJiaSha(ctx: Ctx): GejuHit | null {
  const yr = YANG_REN[ctx.dayGan]
  if (!yr || ctx.monthZhi !== yr) return null
  if (!ctx.has('七杀')) return null
  return { name: '羊刃驾杀', note: `月令羊刃 ${yr} 驾七杀` }
}

/** 羊刃劫财：月支为日主羊刃 + 劫财透干。 */
export function isYangRenJieCai(ctx: Ctx): GejuHit | null {
  const yr = YANG_REN[ctx.dayGan]
  if (!yr || ctx.monthZhi !== yr) return null
  if (!ctx.tou('劫财')) return null
  return { name: '羊刃劫财', note: `月令羊刃 + 劫财透干` }
}

// ——————————————————————— 总量 ———————————————————————

/** 财官印全：财、官(杀)、印 三者皆透干。 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuHit | null {
  if (!ctx.touCat('财')) return null
  if (!ctx.touCat('官杀')) return null
  if (!ctx.touCat('印')) return null
  return { name: '财官印全', note: '财官印三者透干' }
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

/** 禄马同乡：某柱地支既为日主禄又为驿马。 */
export function isLuMaTongXiang(ctx: Ctx): GejuHit | null {
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

/** 以财破印：身弱 + 印透干 + 财透干 (财克印)。 */
export function isYiCaiPoYin(ctx: Ctx): GejuHit | null {
  if (!ctx.shenRuo) return null
  if (!ctx.touCat('印')) return null
  if (!ctx.touCat('财')) return null
  return { name: '以财破印', note: '身弱印被财克' }
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

// ——————————————————————— 五行象法 · 成对判定 ———————————————————————
/*
 * 五行象法按"两五行对关系"分组。每对 judge 函数返回**至多一个**名号,
 * 同一对内的不同子格天然互斥 (定性分支决定落在哪个子格)。
 */

/** 水火对：既济 (有通关) / 相战 (无通关)。*/
export function judgeShuiHuo(ctx: Ctx): GejuHit | null {
  if (!ctx.touWx('水') || !ctx.touWx('火')) return null
  const tongGuan = ctx.touWx('木') || ctx.touWx('土')
  if (tongGuan) return { name: '水火既济', note: '水火并存，有木/土通关' }
  return { name: '水火相战', note: '水火并透，无木/土通关' }
}

/** 木火对：
 *  - 木日主 + 火透 + 木有根 + 无金 → 木火通明
 *  - 火日主 + 地支木 ≥ 3 + 火无重根 → 木多火塞
 */
export function judgeMuHuo(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx === '木') {
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
export function judgeTuJin(ctx: Ctx): GejuHit | null {
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
 *  - 金有根 + 火透 → 金火铸印
 *  - 火透 ≥ 2 + 金无根 → 火旺金衰
 */
export function judgeHuoJin(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  const huoDuo = ctx.ganWxCount('火') >= 2
  const jinRoot = ctx.rootWx('金')
  const huoTou = ctx.touWx('火')
  if (huoDuo && !jinRoot) return { name: '火旺金衰', note: '火多透而金无根' }
  if (jinRoot && huoTou) return { name: '金火铸印', note: '金有根得火锻' }
  return null
}

/** 水木对 (日主水或木)：
 *  - 水透 + 木透 + 无金透 → 水木清华
 *  (水多木漂 / 水少木枯 两种破象暂无独立 md, 不输出名号)
 */
export function judgeShuiMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null
  if (!ctx.touWx('水') || !ctx.touWx('木')) return null
  if (ctx.touWx('金')) return null
  if (ctx.zhiMainWxCount('土') >= 2) return null
  return { name: '水木清华', note: '水生木且木透，无金克' }
}

/** 金水对：冬月 + 金水齐透 + 无火透 → 金寒水冷。*/
export function judgeJinShui(ctx: Ctx): GejuHit | null {
  if (ctx.season !== '冬') return null
  if (ctx.dayWx !== '金' && ctx.dayWx !== '水') return null
  if (!ctx.touWx('金') || !ctx.touWx('水')) return null
  if (ctx.touWx('火')) return null
  return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
}

/** 木土对 (日主土)：地支土 ≥ 2 + 天干木恰 1 位 → 木疏厚土。*/
export function judgeMuTu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (ctx.zhiMainWxCount('土') < 2) return null
  if (ctx.ganWxCount('木') !== 1) return null
  return { name: '木疏厚土', note: '厚土得一木疏之' }
}

/** 金木对 (日主木)：金透 ≥ 2 或 地支金 ≥ 2 → 斧斤伐木。*/
export function judgeJinMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.ganWxCount('金') < 2 && ctx.zhiMainWxCount('金') < 2) return null
  return { name: '斧斤伐木', note: '金旺克木' }
}

/** 调候：冬月木日主 + 火透 → 寒木向阳。*/
export function judgeHanMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null
  return { name: '寒木向阳', note: '冬木见火调候' }
}

/** 特殊：丙日主 + 水透 → 日照江河。*/
export function judgeRiZhao(ctx: Ctx): GejuHit | null {
  if (ctx.dayGan !== '丙') return null
  if (!ctx.touWx('水')) return null
  return { name: '日照江河', note: '丙火照水' }
}

// ——————————————————————— 专旺 ———————————————————————

/**
 * 专旺共用判据 (定性)：
 * - 日主属 targetWx
 * - 月令主气为日主同类或印
 * - 地支主气中 (同类+印) ≥ 3
 * - 无财官透干
 */
function checkZhuanWang(ctx: Ctx, targetWx: string): { note: string } | null {
  if (ctx.dayWx !== targetWx) return null
  if (!ctx.deLing) return null
  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx]
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('财')) return null
  if (ctx.touCat('官杀')) return null
  return { note: `地支主气 ${selfWx}+${yinWx} 共 ${supportZhi} 位，无财官透` }
}

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '火')
  return r ? { name: '炎上格', note: r.note } : null
}
/** 稼穑格：戊己土日主专旺且月令辰戌丑未。 */
export function isJiaSeGe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土')
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}

// ——————————————————————— 从格 ———————————————————————

/**
 * 从X 共用判据：
 * - 不得令 不得地 不得势 (身极弱)
 * - 月令主气为目标类别
 * - 地支主气目标类别 ≥ 3
 * - 目标类别透干
 */
function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (!ctx.shenRuo) return null
  if (ctx.monthCat !== target) return null
  if (!ctx.touCat(target)) return null
  const zhiSupport = ctx.zhiMainWxCount(targetWx)
  if (zhiSupport < 3) return null
  return { note: `身极弱，月令 ${target}，地支 ${targetWx} ${zhiSupport} 位` }
}

/** 从财格：身极弱 + 从财。 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  return r ? { name: '从财格', note: r.note } : null
}

/** 从杀格：身极弱 + 从官杀。 */
export function isCongShaGe(ctx: Ctx): GejuHit | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  return r ? { name: '从杀格', note: r.note } : null
}

/** 弃命从势：身极弱 + 食伤/财/官杀 三方均有透干。 */
export function isQiMingCongShi(ctx: Ctx): GejuHit | null {
  if (!ctx.shenRuo) return null
  if (!ctx.touCat('食伤')) return null
  if (!ctx.touCat('财')) return null
  if (!ctx.touCat('官杀')) return null
  // 排除单一从格 (月令偏向某一方的情况由专门 detector 处理)
  return { name: '弃命从势', note: '身极弱，食伤财官杀三方并透' }
}

// ——————————————————————— 主入口 ———————————————————————

export const DETECTORS: Record<string, (ctx: Ctx) => GejuHit | null> = {
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
  木火对: judgeMuHuo,     // → 木火通明 / 木多火塞
  土金对: judgeTuJin,     // → 土金毓秀 / 土重金埋
  火金对: judgeHuoJin,    // → 金火铸印 / 火旺金衰
  水木对: judgeShuiMu,    // → 水木清华
  金水对: judgeJinShui,   // → 金寒水冷
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

export function detectGeju(pillars: Pillar[]): GejuHit[] {
  if (pillars.length !== 4) return []
  const ctx = buildCtx(pillars)
  const hits: GejuHit[] = []
  for (const [_, detect] of Object.entries(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push({ name: h.name, note: h.note })
  }
  return hits
}
