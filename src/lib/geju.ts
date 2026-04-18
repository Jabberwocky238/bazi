/**
 * 格局识别器。每个 isXxx(ctx) 返回 GejuHit | null。
 * 判定标准来自 public/bazi-skills/core/格局/<name>.md 的「成立条件」章节。
 * 受限于无法精确判断"紧贴""通关""合冲"等位置关系，下列判定做了合理近似。
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

const WX_GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const WX_CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
const WX_GENERATED_BY: Record<string, string> = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' }
const WX_CONTROLLED_BY: Record<string, string> = { 土: '木', 水: '土', 火: '水', 金: '火', 木: '金' }

const SEASON_BY_ZHI: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

export interface GejuHit {
  name: string
  note: string
}

const SHI_SHEN_CAT: Record<string, '比劫' | '印' | '食伤' | '财' | '官杀'> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])
const GAN_WEIGHT = 1.0
const HIDDEN_WEIGHTS = [0.6, 0.3, 0.1]

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
  /** 年/月/时柱天干十神 (不含日主) */
  ganSs: string[]
  /** 四柱藏干十神 flatten */
  hideSs: string[]
  /** 每十神的加权合计 (天干 1.0, 主气 0.6, 中 0.3, 余 0.1) */
  wt: Record<string, number>
  /** 每类别的加权合计 */
  wtCat: Record<string, number>
  /** 每五行的加权合计 (同算法) */
  wxPool: Record<string, number>
  /** 五行总池 */
  totalWx: number
  /** 日主五行 */
  dayWx: string
  /** 月支季节 */
  season: '春' | '夏' | '秋' | '冬' | ''
  /** 天干透出某十神 */
  tou(ss: string): boolean
  /** 十神是否在天干或地支出现 */
  has(ss: string): boolean
  /** 十神力量 (加权) */
  power(ss: string): number
  /** 十神是否"有力" = 天干透出 或 某柱地支主气即此十神 */
  strong(ss: string): boolean
  /** 类别是否"有力" */
  strongCat(cat: string): boolean
  /** 类别总合 */
  powerCat(cat: string): number
  /** 天干有某五行 (任意柱) */
  touWx(wx: string): boolean
  /** 五行占比 */
  wxRatio(wx: string): number
  /** 日主强弱 0-1 (比劫+印)/total */
  strength: number
  /** 月令主气十神类别 */
  monthCat: string
  /** 得令 (月令为 比劫/印) */
  deLing: boolean
  /** 身强 (粗略) */
  shenQiang: boolean
  /** 身弱 (粗略) */
  shenRuo: boolean
}

function buildCtx(pillars: Pillar[]): Ctx {
  const [yearP, monthP, dayP, hourP] = pillars
  const ganSs = [yearP.shishen, monthP.shishen, hourP.shishen].filter(
    (s) => s && s !== '日主',
  )
  const hideSs = pillars.flatMap((p) => p.hideShishen ?? [])

  const wt: Record<string, number> = {}
  const wtCat: Record<string, number> = {}
  const addWeight = (ss: string, w: number) => {
    if (!ss || ss === '日主') return
    wt[ss] = (wt[ss] ?? 0) + w
    const cat = SHI_SHEN_CAT[ss]
    if (cat) wtCat[cat] = (wtCat[cat] ?? 0) + w
  }
  for (let i = 0; i < 4; i++) {
    if (i !== 2) addWeight(pillars[i].shishen, GAN_WEIGHT)
    pillars[i].hideShishen.forEach((s, j) => addWeight(s, HIDDEN_WEIGHTS[j] ?? 0.05))
  }

  const totalPower =
    (wtCat['比劫'] ?? 0) +
    (wtCat['印'] ?? 0) +
    (wtCat['食伤'] ?? 0) +
    (wtCat['财'] ?? 0) +
    (wtCat['官杀'] ?? 0)
  const selfPower = (wtCat['比劫'] ?? 0) + (wtCat['印'] ?? 0)
  const strength = totalPower > 0 ? selfPower / totalPower : 0

  const monthPrimaryShishen = monthP.hideShishen[0] ?? ''
  const monthCat = SHI_SHEN_CAT[monthPrimaryShishen] ?? ''
  const deLing = monthCat === '比劫' || monthCat === '印'

  // —— 五行池 (与权重方案一致) ——
  const wxPool: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (let i = 0; i < 4; i++) {
    const p = pillars[i]
    const gw = ganWuxing(p.gan)
    if (gw) wxPool[gw] = (wxPool[gw] ?? 0) + GAN_WEIGHT
    p.hideGans.forEach((g, j) => {
      const w = ganWuxing(g)
      if (w) wxPool[w] = (wxPool[w] ?? 0) + (HIDDEN_WEIGHTS[j] ?? 0.05)
    })
  }
  const totalWx = Object.values(wxPool).reduce((a, b) => a + b, 0)
  const dayWx = WU_XING[dayP.gan as Gan] ?? ganWuxing(dayP.gan)
  const season = SEASON_BY_ZHI[monthP.zhi as string] ?? ''

  const ctx: Ctx = {
    pillars,
    dayGan: dayP.gan as Gan,
    dayZhi: dayP.zhi as Zhi,
    dayGz: dayP.gz,
    monthZhi: monthP.zhi as Zhi,
    yearZhi: yearP.zhi as Zhi,
    ganSs,
    hideSs,
    wt,
    wtCat,
    wxPool,
    totalWx,
    dayWx,
    season,
    tou: (s) => ganSs.includes(s),
    has: (s) => ganSs.includes(s) || hideSs.includes(s),
    power: (s) => wt[s] ?? 0,
    powerCat: (c) => wtCat[c] ?? 0,
    strong: (s) =>
      ganSs.includes(s) || pillars.some((p) => p.hideShishen[0] === s),
    strongCat: (c) =>
      pillars.some((p, i) => {
        if (i !== 2 && SHI_SHEN_CAT[p.shishen] === c) return true
        return SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === c
      }),
    touWx: (wx) => pillars.some((p) => ganWuxing(p.gan) === wx),
    wxRatio: (wx) => (totalWx > 0 ? (wxPool[wx] ?? 0) / totalWx : 0),
    strength,
    monthCat,
    deLing,
    shenQiang: deLing || strength >= 0.5,
    shenRuo: !deLing && strength < 0.35,
  }
  return ctx
}

// ——————————————————————— 正格 ———————————————————————

/**
 * 建禄格：月支为日主之禄。
 * @see 格局/建禄格.md 成立条件 1
 */
export function isJianLuGe(ctx: Ctx): GejuHit | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 为日主 ${ctx.dayGan} 之禄`,
  }
}

/**
 * 魁罡格：日柱为庚辰/庚戌/壬辰/戊戌。
 * @see 格局/魁罡格.md
 */
export function isKuiGangGe(ctx: Ctx): GejuHit | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 为魁罡` }
}

/**
 * 壬骑龙背：日柱壬辰。
 * @see 格局/壬骑龙背.md
 */
export function isRenQiLongBei(ctx: Ctx): GejuHit | null {
  if (ctx.dayGz !== '壬辰') return null
  return { name: '壬骑龙背', note: '日柱壬辰' }
}

// ——————————————————————— 官杀相关 ———————————————————————

/**
 * 官杀混杂：正官与七杀同时有力存在 (至少有一个透干)。
 * @see 格局/官杀混杂.md 成立条件：天干同时透出 / 隐混杂
 */
export function isGuanShaHunZa(ctx: Ctx): GejuHit | null {
  const touGuan = ctx.tou('正官')
  const touSha = ctx.tou('七杀')
  const hasGuan = ctx.has('正官')
  const hasSha = ctx.has('七杀')
  if (!(hasGuan && hasSha)) return null
  const form = touGuan && touSha ? '天干双透' : '一透一藏'
  return { name: '官杀混杂', note: `正官 + 七杀 ${form}` }
}

/**
 * 官印相生：正官清纯 + 印有力 + 身不过弱 + 无财破印 + 无伤官见官。
 * @see 格局/官印相生.md 成立条件
 */
export function isGuanYinXiangSheng(ctx: Ctx): GejuHit | null {
  if (!ctx.has('正官')) return null
  if (ctx.has('七杀')) return null // 官杀混杂 → 非纯官印
  if (!(ctx.has('正印') || ctx.has('偏印'))) return null
  if (ctx.shenRuo) return null
  // 无财破印：财重 > 印
  const caiPow = ctx.powerCat('财')
  const yinPow = ctx.powerCat('印')
  if (caiPow > yinPow * 1.3) return null
  // 无伤官直接克官 (若伤官透干，破格)
  if (ctx.tou('伤官')) return null
  return {
    name: '官印相生',
    note: `正官配印，身${ctx.shenQiang ? '强' : '中'}`,
  }
}

/**
 * 杀印相生：七杀有力 + 印通根 + 身不过弱 + 无财破印。
 * @see 格局/杀印相生.md 成立条件 1~5
 */
export function isShaYinXiangSheng(ctx: Ctx): GejuHit | null {
  if (!ctx.has('七杀')) return null
  if (ctx.has('正官')) return null // 官杀混杂另论
  if (!(ctx.has('正印') || ctx.has('偏印'))) return null
  if (ctx.shenRuo) return null
  const caiPow = ctx.powerCat('财')
  const yinPow = ctx.powerCat('印')
  if (caiPow > yinPow * 1.3) return null
  return { name: '杀印相生', note: '七杀配印，化压为养' }
}

// ——————————————————————— 食伤相关 ———————————————————————

/**
 * 食神制杀：食神透干有力 + 七杀有力 + 食神力 ≥ 七杀 * 0.7 + 无枭印夺食 + 身不虚。
 * @see 格局/食神制杀.md 成立条件 1~5
 */
export function isShiShenZhiSha(ctx: Ctx): GejuHit | null {
  if (!ctx.strong('食神')) return null
  if (!ctx.has('七杀')) return null
  if (ctx.tou('偏印')) return null // 枭神夺食
  if (ctx.shenRuo) return null
  const shi = ctx.power('食神')
  const sha = ctx.power('七杀')
  if (shi < sha * 0.7) return null
  return {
    name: '食神制杀',
    note: `食神 ${shi.toFixed(1)} 制 七杀 ${sha.toFixed(1)}`,
  }
}

/**
 * 枭神夺食：偏印有力 + 食神存在 + 偏印力 ≥ 食神 + 无财救。
 * @see 格局/枭神夺食.md 判断维度 1~3
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuHit | null {
  if (!ctx.strong('偏印')) return null
  if (!ctx.has('食神')) return null
  const pianYin = ctx.power('偏印')
  const shi = ctx.power('食神')
  if (pianYin < shi) return null
  // 有财救 (财 ≥ 偏印 0.6)
  if (ctx.powerCat('财') >= pianYin * 0.6) return null
  return { name: '枭神夺食', note: `偏印 ${pianYin.toFixed(1)} 克食神 ${shi.toFixed(1)}` }
}

/**
 * 伤官见官：伤官 + 正官同时有力 + 无印制 + 无财通关 (破格)。
 * @see 格局/伤官见官.md 成立条件 1~4
 */
export function isShangGuanJianGuan(ctx: Ctx): GejuHit | null {
  if (!ctx.strong('伤官')) return null
  if (!ctx.strong('正官')) return null
  // 有印制伤 → 伤官佩印，不成"见"
  const yinPow = ctx.powerCat('印')
  const shangPow = ctx.power('伤官')
  if (yinPow >= shangPow * 0.8) return null
  // 有财通关 (财至少与伤相当) → 伤 → 财 → 官
  if (ctx.powerCat('财') >= shangPow * 0.6) return null
  return { name: '伤官见官', note: '伤官无制直接克官' }
}

/**
 * 伤官合杀：伤官 + 七杀同时存在。
 * @see 格局/伤官合杀.md (化解官杀混杂)
 */
export function isShangGuanHeSha(ctx: Ctx): GejuHit | null {
  if (!ctx.has('伤官') || !ctx.has('七杀')) return null
  return { name: '伤官合杀', note: '伤官 + 七杀，可合化凶锋' }
}

/**
 * 伤官生财：伤官有力 + 财有力 + 身不过弱 + 无强印克伤。
 * @see 格局/伤官生财.md 成立条件 1~5
 */
export function isShangGuanShengCai(ctx: Ctx): GejuHit | null {
  if (!ctx.strong('伤官')) return null
  if (!ctx.strongCat('财')) return null
  if (ctx.shenRuo) return null
  const yinPow = ctx.powerCat('印')
  const shangPow = ctx.power('伤官')
  if (yinPow >= shangPow) return null // 印重克伤，链断
  return {
    name: '伤官生财',
    note: `伤官 ${shangPow.toFixed(1)} → 财 ${ctx.powerCat('财').toFixed(1)}`,
  }
}

/**
 * 伤官佩印：伤官有力 + 印有力 + 印略强或相当 + 无财破印 + 身不过弱。
 * @see 格局/伤官佩印.md 成立条件 1~5
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuHit | null {
  if (!ctx.strong('伤官')) return null
  if (!ctx.strongCat('印')) return null
  if (ctx.shenRuo) return null
  const yinPow = ctx.powerCat('印')
  const shangPow = ctx.power('伤官')
  // 印略强或相当 (0.8 ≤ 印/伤 ≤ 3)
  if (yinPow < shangPow * 0.8 || yinPow > shangPow * 3) return null
  // 无强财破印
  if (ctx.powerCat('财') > yinPow) return null
  return {
    name: '伤官佩印',
    note: `伤 ${shangPow.toFixed(1)} · 印 ${yinPow.toFixed(1)} 平衡`,
  }
}

/**
 * 食伤混杂：食神与伤官同时透干 (破格象)。
 * @see 格局/食伤混杂.md
 */
export function isShiShangHunZa(ctx: Ctx): GejuHit | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官并透' }
}

/**
 * 食伤泄秀：身强 + 食伤透干或月令 + 无重枭克食伤 + 不过于混杂。
 * @see 格局/食伤泄秀.md 成立条件 1~5
 */
export function isShiShangXieXiu(ctx: Ctx): GejuHit | null {
  if (!ctx.shenQiang) return null
  const hasShiShangTou = ctx.tou('食神') || ctx.tou('伤官')
  const monthShiShang = ctx.monthCat === '食伤'
  if (!hasShiShangTou && !monthShiShang) return null
  const shishangPow = ctx.powerCat('食伤')
  if (shishangPow < 1.0) return null
  // 无重枭克
  const yinPow = ctx.powerCat('印')
  if (yinPow > shishangPow * 1.2) return null
  return {
    name: '食伤泄秀',
    note: `身强 ${ctx.strength.toFixed(2)}，食伤 ${shishangPow.toFixed(1)} 泄秀`,
  }
}

// ——————————————————————— 羊刃系 ———————————————————————

/**
 * 羊刃驾杀：月令为日主之羊刃 + 七杀存在。
 * @see 格局/羊刃驾杀.md
 */
export function isYangRenJiaSha(ctx: Ctx): GejuHit | null {
  const yr = YANG_REN[ctx.dayGan]
  if (!yr || ctx.monthZhi !== yr) return null
  if (!ctx.strong('七杀')) return null
  return { name: '羊刃驾杀', note: `月令羊刃 ${yr} 驾七杀` }
}

/**
 * 羊刃劫财：月令为日主之羊刃 + 劫财透出。
 * @see 格局/羊刃劫财.md
 */
export function isYangRenJieCai(ctx: Ctx): GejuHit | null {
  const yr = YANG_REN[ctx.dayGan]
  if (!yr || ctx.monthZhi !== yr) return null
  if (!ctx.tou('劫财')) return null
  return { name: '羊刃劫财', note: `月令羊刃 + 劫财透干` }
}

// ——————————————————————— 其它 ———————————————————————

/**
 * 财官印全：财、官(杀)、印三者齐备，最好至少两者透干。
 * @see 格局/财官印全.md
 */
export function isCaiGuanYinQuan(ctx: Ctx): GejuHit | null {
  const hasCai = ctx.strongCat('财')
  const hasGuanSha = ctx.strongCat('官杀')
  const hasYin = ctx.strongCat('印')
  if (!(hasCai && hasGuanSha && hasYin)) return null
  const touCount = [
    ctx.tou('正财') || ctx.tou('偏财'),
    ctx.tou('正官') || ctx.tou('七杀'),
    ctx.tou('正印') || ctx.tou('偏印'),
  ].filter(Boolean).length
  if (touCount < 2) return null
  return { name: '财官印全', note: `财官印俱全，${touCount} 组透干` }
}

/**
 * 比劫重重：比劫加权 ≥ 3 且为全局最重类别。
 * @see 格局/比劫重重.md (身过旺)
 */
export function isBiJieChongChong(ctx: Ctx): GejuHit | null {
  const bi = ctx.powerCat('比劫')
  if (bi < 3) return null
  const allCats = ['比劫', '印', '食伤', '财', '官杀']
  const max = Math.max(...allCats.map((c) => ctx.powerCat(c)))
  if (bi < max - 0.01) return null
  return { name: '比劫重重', note: `比劫力 ${bi.toFixed(1)}，全局最重` }
}

/**
 * 禄马同乡：日主禄位与驿马落在同一地支柱。
 * @see 格局/禄马同乡.md
 */
export function isLuMaTongXiang(ctx: Ctx): GejuHit | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  for (let i = 0; i < ctx.pillars.length; i++) {
    const p = ctx.pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      return {
        name: '禄马同乡',
        note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 兼禄与驿马`,
      }
    }
  }
  return null
}

/**
 * 以财破印：财有力 + 印有力 + 财力 > 印力 + 身弱需印。
 * @see 格局/以财破印.md (破印为病)
 */
export function isYiCaiPoYin(ctx: Ctx): GejuHit | null {
  const cai = ctx.powerCat('财')
  const yin = ctx.powerCat('印')
  if (cai < 1.5 || yin < 0.5) return null
  if (cai <= yin) return null
  if (!ctx.shenRuo) return null // 身强不怕破印
  return { name: '以财破印', note: `身弱财 ${cai.toFixed(1)} 重克印 ${yin.toFixed(1)}` }
}

/**
 * 财多身弱：财加权 ≥ 比劫+印 × 2 且身弱。
 * @see 格局/财多身弱.md
 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuHit | null {
  const cai = ctx.powerCat('财')
  const self = ctx.powerCat('比劫') + ctx.powerCat('印')
  if (!ctx.shenRuo) return null
  if (cai < self * 2) return null
  return { name: '财多身弱', note: `财 ${cai.toFixed(1)} ≫ 比印 ${self.toFixed(1)}` }
}

// ——————————————————————— 五行象法 ———————————————————————

/**
 * 木火通明：甲/乙日 + 火透 + 木有根 + 无重金克木 + 无重水灭火。
 * @see 格局/木火通明.md
 */
export function isMuHuoTongMing(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (!ctx.touWx('火')) return null
  if (ctx.wxPool['木'] < 1.5) return null
  if (ctx.wxPool['火'] < 1.0) return null
  if (ctx.wxPool['金'] > ctx.wxPool['木'] * 0.8) return null
  if (ctx.wxPool['水'] > ctx.wxPool['火'] * 1.5) return null
  return {
    name: '木火通明',
    note: `木 ${ctx.wxPool['木'].toFixed(1)} 生 火 ${ctx.wxPool['火'].toFixed(1)}`,
  }
}

/**
 * 水木清华：水生木 + 比例 1:1~1:2 + 无重金克木 + 无重土塞水。
 * @see 格局/水木清华.md
 */
export function isShuiMuQingHua(ctx: Ctx): GejuHit | null {
  const shui = ctx.wxPool['水']
  const mu = ctx.wxPool['木']
  if (shui < 1.0 || mu < 1.0) return null
  const ratio = mu / shui
  if (ratio < 0.8 || ratio > 2.5) return null
  if (ctx.wxPool['金'] > mu * 0.6) return null
  if (ctx.wxPool['土'] > shui * 1.3) return null
  // 日主为水或木最典型
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null
  return { name: '水木清华', note: `水 ${shui.toFixed(1)} : 木 ${mu.toFixed(1)}` }
}

/**
 * 金寒水冷：冬月 + 金水两旺 + 无火调候 (病象)。
 * @see 格局/金寒水冷.md
 */
export function isJinHanShuiLeng(ctx: Ctx): GejuHit | null {
  if (ctx.season !== '冬') return null
  const jin = ctx.wxPool['金']
  const shui = ctx.wxPool['水']
  if (jin + shui < ctx.totalWx * 0.55) return null
  if (ctx.wxPool['火'] > 0.6) return null
  if (ctx.dayWx !== '金' && ctx.dayWx !== '水') return null
  return { name: '金寒水冷', note: `冬月 金水 ${(jin + shui).toFixed(1)}，火缺` }
}

/**
 * 水火既济：水火并存且相近 + **有木/土通关** (水→木→火 或 火→土缓冲)。
 * @see 格局/水火既济.md
 */
export function isShuiHuoJiJi(ctx: Ctx): GejuHit | null {
  const jjShui = ctx.wxPool['水']
  const jjHuo = ctx.wxPool['火']
  if (jjShui < 1.0 || jjHuo < 1.0) return null
  const jjRatio = Math.min(jjShui, jjHuo) / Math.max(jjShui, jjHuo)
  if (jjRatio < 0.4) return null
  // 必须有通关 (木 生火 / 土 承火泄水)
  const jjTongGuan = ctx.wxPool['木'] + ctx.wxPool['土']
  if (jjTongGuan < 1.0) return null
  return {
    name: '水火既济',
    note: `水 ${jjShui.toFixed(1)} · 火 ${jjHuo.toFixed(1)}，通关 ${jjTongGuan.toFixed(1)}`,
  }
}

/**
 * 水火相战：水火俱旺 + **无木/土通关** (对抗)。与"水火既济"互斥。
 * @see 格局/水火相战.md
 */
export function isShuiHuoXiangZhan(ctx: Ctx): GejuHit | null {
  const xzShui = ctx.wxPool['水']
  const xzHuo = ctx.wxPool['火']
  if (xzShui < 1.5 || xzHuo < 1.5) return null
  // 无通关 — 与既济互斥 (同阈值 1.0)
  const xzTongGuan = ctx.wxPool['木'] + ctx.wxPool['土']
  if (xzTongGuan >= 1.0) return null
  return {
    name: '水火相战',
    note: `水 ${xzShui.toFixed(1)} vs 火 ${xzHuo.toFixed(1)}，通关仅 ${xzTongGuan.toFixed(1)}`,
  }
}

/**
 * 火旺金衰：火远强于金 + 日主金。
 * @see 格局/火旺金衰.md
 */
export function isHuoWangJinShuai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  const huo = ctx.wxPool['火']
  const jin = ctx.wxPool['金']
  if (huo < jin * 1.6) return null
  if (huo < 2.0) return null
  return { name: '火旺金衰', note: `火 ${huo.toFixed(1)} ≫ 金 ${jin.toFixed(1)}` }
}

/**
 * 土金毓秀：土日主 + 金食伤透出清透。
 * @see 格局/土金毓秀.md
 */
export function isTuJinYuXiu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!ctx.touWx('金')) return null
  const tu = ctx.wxPool['土']
  const jin = ctx.wxPool['金']
  if (tu < 1.5 || jin < 0.8) return null
  if (ctx.wxPool['木'] > tu * 0.5) return null
  return { name: '土金毓秀', note: `土 ${tu.toFixed(1)} 生 金 ${jin.toFixed(1)}` }
}

/**
 * 土重金埋：金日主 + 土过旺把金埋没 (印过旺)。
 * @see 格局/土重金埋.md
 */
export function isTuZhongJinMai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  const tu = ctx.wxPool['土']
  const jin = ctx.wxPool['金']
  if (tu < jin * 2) return null
  if (tu < 3.0) return null
  return { name: '土重金埋', note: `土 ${tu.toFixed(1)} 压 金 ${jin.toFixed(1)}` }
}

/**
 * 寒木向阳：冬月木日主 + 火调候。
 * @see 格局/寒木向阳.md
 */
export function isHanMuXiangYang(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (!ctx.touWx('火')) return null
  if (ctx.wxPool['火'] < 0.8) return null
  return { name: '寒木向阳', note: `冬木见火调候` }
}

/**
 * 木多火塞：火日主 + 木过旺压火 (印过旺压官杀之反)。
 * @see 格局/木多火塞.md
 */
export function isMuDuoHuoSe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '火') return null
  const mu = ctx.wxPool['木']
  const huo = ctx.wxPool['火']
  if (mu < huo * 2) return null
  if (mu < 3.0) return null
  return { name: '木多火塞', note: `木 ${mu.toFixed(1)} 塞 火 ${huo.toFixed(1)}` }
}

/**
 * 木疏厚土：土日主 + 木为官杀适度疏土。
 * @see 格局/木疏厚土.md
 */
export function isMuShuHouTu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  const tu = ctx.wxPool['土']
  const mu = ctx.wxPool['木']
  if (tu < 2.5) return null
  if (mu < 0.8 || mu > tu * 0.8) return null
  return { name: '木疏厚土', note: `土 ${tu.toFixed(1)} 得 木 ${mu.toFixed(1)} 疏之` }
}

/**
 * 斧斤伐木：木日主 + 金过旺克木 (杀克身)。
 * @see 格局/斧斤伐木.md
 */
export function isFuJinFaMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const jin = ctx.wxPool['金']
  const mu = ctx.wxPool['木']
  if (jin < mu * 1.5) return null
  if (jin < 2.0) return null
  return { name: '斧斤伐木', note: `金 ${jin.toFixed(1)} 伐 木 ${mu.toFixed(1)}` }
}

/**
 * 日照江河：丙火日主 + 壬癸水透出。
 * @see 格局/日照江河.md
 */
export function isRiZhaoJiangHe(ctx: Ctx): GejuHit | null {
  if (ctx.dayGan !== '丙') return null
  if (!ctx.touWx('水')) return null
  if (ctx.wxPool['水'] < 1.0) return null
  return { name: '日照江河', note: '丙火照水' }
}

/**
 * 金火铸印：金日主 + 火为官杀 + 火能锻金。
 * @see 格局/金火铸印.md
 */
export function isJinHuoZhuYin(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  const jin = ctx.wxPool['金']
  const huo = ctx.wxPool['火']
  if (jin < 1.5 || huo < 1.0) return null
  const r = huo / jin
  if (r < 0.4 || r > 1.2) return null
  return { name: '金火铸印', note: `金 ${jin.toFixed(1)} 得 火 ${huo.toFixed(1)} 锻之` }
}

// ——————————————————————— 专旺 / 从格 ———————————————————————

/**
 * 共享：一行独旺判定。日主属 targetWx + 印比占比 ≥ 0.7 + 月令得令 + 财官食伤 ≤ 0.15。
 */
function checkZhuanWang(ctx: Ctx, targetWx: string): { ratio: number } | null {
  if (ctx.dayWx !== targetWx) return null
  const zwSelf = ctx.wxPool[ctx.dayWx] ?? 0
  const zwYin = ctx.wxPool[WX_GENERATED_BY[ctx.dayWx]] ?? 0
  const zwRatio = (zwSelf + zwYin) / ctx.totalWx
  if (zwRatio < 0.7) return null
  if (!ctx.deLing) return null
  const zwCai = ctx.wxPool[WX_CONTROLS[ctx.dayWx]] ?? 0
  const zwKs = ctx.wxPool[WX_CONTROLLED_BY[ctx.dayWx]] ?? 0
  if ((zwCai + zwKs) / ctx.totalWx > 0.15) return null
  return { ratio: zwRatio }
}

/**
 * 曲直格：甲乙木日主专旺。
 * @see 格局/专旺格/曲直格.md
 */
export function isQuZhiGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '木')
  if (!r) return null
  return { name: '曲直格', note: `木独旺 ${(r.ratio * 100).toFixed(0)}%` }
}

/**
 * 炎上格：丙丁火日主专旺。
 * @see 格局/专旺格/炎上格.md
 */
export function isYanShangGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '火')
  if (!r) return null
  return { name: '炎上格', note: `火独旺 ${(r.ratio * 100).toFixed(0)}%` }
}

/**
 * 润下格：壬癸水日主专旺。
 * @see 格局/专旺格/润下格.md
 */
export function isRunXiaGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '水')
  if (!r) return null
  return { name: '润下格', note: `水独旺 ${(r.ratio * 100).toFixed(0)}%` }
}

/**
 * 稼穑格：戊己土日主 + 月令辰戌丑未 + 土专旺 (最严的土专旺)。
 * @see 格局/专旺格/稼穑格.md
 */
export function isJiaSeGe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const jsTu = ctx.wxPool['土']
  if (jsTu / ctx.totalWx < 0.55) return null
  if (ctx.wxPool['木'] > jsTu * 0.3) return null
  if (ctx.wxPool['水'] > jsTu * 0.3) return null
  return { name: '稼穑格', note: `土 ${jsTu.toFixed(1)} / ${ctx.totalWx.toFixed(1)}，月令 ${ctx.monthZhi}` }
}

/**
 * 从财格：身极弱 + 财独旺。
 * @see 格局/从财格.md
 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const self = (ctx.wxPool[ctx.dayWx] ?? 0) + (ctx.wxPool[WX_GENERATED_BY[ctx.dayWx]] ?? 0)
  if (self / ctx.totalWx > 0.2) return null
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const cai = ctx.wxPool[caiWx] ?? 0
  if (cai / ctx.totalWx < 0.5) return null
  return {
    name: '从财格',
    note: `财 ${caiWx} ${(cai / ctx.totalWx * 100).toFixed(0)}%，身极弱`,
  }
}

/**
 * 从杀格：身极弱 + 官杀独旺。
 * @see 格局/从杀格.md
 */
export function isCongShaGe(ctx: Ctx): GejuHit | null {
  const self = (ctx.wxPool[ctx.dayWx] ?? 0) + (ctx.wxPool[WX_GENERATED_BY[ctx.dayWx]] ?? 0)
  if (self / ctx.totalWx > 0.2) return null
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const ks = ctx.wxPool[ksWx] ?? 0
  if (ks / ctx.totalWx < 0.5) return null
  return {
    name: '从杀格',
    note: `官杀 ${ksWx} ${(ks / ctx.totalWx * 100).toFixed(0)}%，身极弱`,
  }
}

/**
 * 从革格：庚辛金日主专旺。
 * @see 格局/专旺格/从革格.md
 */
export function isCongGeGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '金')
  if (!r) return null
  return { name: '从革格', note: `金独旺 ${(r.ratio * 100).toFixed(0)}%` }
}

/**
 * 弃命从势：身极弱 + 财官食伤三方皆有势。
 * @see 格局/弃命从势.md
 */
export function isQiMingCongShi(ctx: Ctx): GejuHit | null {
  const self = (ctx.wxPool[ctx.dayWx] ?? 0) + (ctx.wxPool[WX_GENERATED_BY[ctx.dayWx]] ?? 0)
  if (self / ctx.totalWx > 0.2) return null
  const shishang = ctx.wxPool[WX_GENERATES[ctx.dayWx]] ?? 0
  const cai = ctx.wxPool[WX_CONTROLS[ctx.dayWx]] ?? 0
  const ks = ctx.wxPool[WX_CONTROLLED_BY[ctx.dayWx]] ?? 0
  const th = ctx.totalWx * 0.15
  if (shishang < th || cai < th || ks < th) return null
  // 不能任何一个独大到 > 0.5 (那应归单从格)
  if (shishang / ctx.totalWx > 0.55) return null
  if (cai / ctx.totalWx > 0.55) return null
  if (ks / ctx.totalWx > 0.55) return null
  return { name: '弃命从势', note: '身极弱，财官食伤势均' }
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
  // 总量型
  财官印全: isCaiGuanYinQuan,
  比劫重重: isBiJieChongChong,
  禄马同乡: isLuMaTongXiang,
  以财破印: isYiCaiPoYin,
  财多身弱: isCaiDuoShenRuo,
  // 五行象法
  木火通明: isMuHuoTongMing,
  水木清华: isShuiMuQingHua,
  金寒水冷: isJinHanShuiLeng,
  水火既济: isShuiHuoJiJi,
  水火相战: isShuiHuoXiangZhan,
  火旺金衰: isHuoWangJinShuai,
  土金毓秀: isTuJinYuXiu,
  土重金埋: isTuZhongJinMai,
  寒木向阳: isHanMuXiangYang,
  木多火塞: isMuDuoHuoSe,
  木疏厚土: isMuShuHouTu,
  斧斤伐木: isFuJinFaMu,
  日照江河: isRiZhaoJiangHe,
  金火铸印: isJinHuoZhuYin,
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
  for (const [name, detect] of Object.entries(DETECTORS)) {
    const h = detect(ctx)
    if (!h) continue
    hits.push({ name, note: h.note })
  }
  return hits
}
