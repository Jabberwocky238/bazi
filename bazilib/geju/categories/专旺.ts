import { GejuContext, WX_GENERATED_BY, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { Shishen, WuXing, Zhi } from '@jabberwocky238/bazi-engine'

/**
 * 专旺共用判据 — 与 bazi-skills 《格局/专旺格/成立条件.md》对照:
 *
 *  bazi-skills 5 条 (《渊海子平·杂格》《三命通会·五行专旺》《滴天髓·从象》):
 *   1. 日主与月令同气 — 日主五行 = 月令本气五行  [静态, 不可补]
 *   2. 地支会该五行之局 — 三合 OR 三会 (土稼穑用四库齐 / 三库见 替代)
 *      [可被大运 / 流年地支补齐缺失的最后一字 → suiyunTrigger]
 *   3. 天干透比劫 / 印 遍布一气 — 日主外另透同五行 ≥ 1 位
 *      [可被大运 / 流年天干补齐 → suiyunTrigger]
 *   4. 原局无克本气之字 — 官杀不透 / 不藏 [岁运透官杀 → suiyunBreak]
 *   5. 食伤可微泄 — 此实现严判: 不许透 [岁运透食伤 → suiyunBreak]
 *
 *  附: 财透 (条件 4 副，"克气" 之财) — maxCaiTou 控量, 稼穑放宽到 1。
 *
 *  返回 ZhuanWangResult — 由各子格 detector 喂给 emitGeju 决定:
 *    - 主局已成 (baseFormed) + 岁运不破                           → 显, normal
 *    - 主局已成 + 岁运透官杀 / 食伤 / 超限财                       → 显 + Break
 *    - 主局缺 ② 或 ③ + 岁运地支补三合 / 天干透同气                 → 隐 + Trigger
 *    - 主局有 ④ ⑤ 类破气 (官杀 / 食伤透) — 主局已破 → 不补 → null
 */
const SANHE_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['亥', '卯', '未'],
  火: ['寅', '午', '戌'],
  金: ['巳', '酉', '丑'],
  水: ['申', '子', '辰'],
}
const SANHUI_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['寅', '卯', '辰'],
  火: ['巳', '午', '未'],
  金: ['申', '酉', '戌'],
  水: ['亥', '子', '丑'],
}
const SI_KU: readonly Zhi[] = ['辰', '戌', '丑', '未']

const CAI_SHISHENS: Shishen[] = ['正财', '偏财']

function hasAll(zhis: Zhi[], triple: readonly Zhi[]): boolean {
  return triple.every((z) => zhis.includes(z))
}

interface ZhuanWangResult {
  /** 主局成格 (前 5 条全部主局满足)。 */
  baseFormed: boolean
  /** 主局 + 岁运 后成格 (条件 2/3 可被岁运补齐, 条件 4/5/6 任一被岁运破则 false)。 */
  withExtrasFormed: boolean
  /** 是否选了岁运。 */
  hasExtras: boolean
  /** 描述文字 (原局优先, 岁运补齐时标注 "岁运补…")。 */
  note: string
}

function checkZhuanWang(
  ctx: GejuContext,
  targetWx: string,
  maxCaiTou = 0,
): ZhuanWangResult | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  // —— 条件 1: 日主与月令同气 (静态前提) ——
  if (ctx.dayWx !== targetWx) return null
  if (!strength.deLing) return null

  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx] as WuXing
  const mainZhis = ctx.mainArr.map((p) => p.pillar.zhi.str as Zhi)
  const extraZhis = extras.extraArr.map((p) => p.pillar.zhi.str as Zhi)
  const allZhis = [...mainZhis, ...extraZhis]

  // —— 条件 2: 三合 / 三会 / (土) 四库齐 (可被岁运补齐) ——
  let baseLayout = ''
  let extraLayout = ''
  let base2 = false
  let ext2 = false
  if (selfWx === '土') {
    // md: "辰戌丑未四库全见或三见" — 按 地支位数 计 (重复也算, 一气遍布优先).
    // 例 己日 未未辰酉 (3 个库位即为"三见"); 全见 = 不重复 4 库齐。
    const baseN = mainZhis.filter((z) => (SI_KU as readonly Zhi[]).includes(z)).length
    const baseDistinct = SI_KU.filter((z) => mainZhis.includes(z)).length
    const allN = allZhis.filter((z) => (SI_KU as readonly Zhi[]).includes(z)).length
    base2 = baseN >= 3
    ext2 = allN >= 3
    if (base2) baseLayout = baseDistinct === 4 ? '四库齐' : `三库见 (${baseN}位)`
    else if (ext2) extraLayout = '岁运补三库'
  } else {
    const sh = SANHE_TRIPLES[selfWx]
    const hh = SANHUI_TRIPLES[selfWx]
    if (sh && hasAll(mainZhis, sh)) { base2 = true; baseLayout = `三合 ${sh.join('')}` }
    else if (hh && hasAll(mainZhis, hh)) { base2 = true; baseLayout = `三会 ${hh.join('')}` }

    if (sh && hasAll(allZhis, sh)) {
      ext2 = true
      if (!base2) extraLayout = `岁运补三合 ${sh.join('')}`
    } else if (hh && hasAll(allZhis, hh)) {
      ext2 = true
      if (!base2) extraLayout = `岁运补三会 ${hh.join('')}`
    }
  }

  // —— 条件 3: 天干 比劫 + 印 ≥ 2 (含日主，可被岁运补齐) ——
  // md 明文 "另有至少两位为同五行的比劫或生我之印星", 含印宽放。
  const baseGanN = ctx.ganWxCount(targetWx as WuXing) + ctx.ganWxCount(yinWx)
  const allGanN = baseGanN
    + extras.extraGanWxCount(targetWx as WuXing) + extras.extraGanWxCount(yinWx)
  const base3 = baseGanN >= 2
  const ext3 = allGanN >= 2

  // —— 条件 4: 无克本气 (依 md "天干无官杀透 + 地支官杀本气不成势") ——
  // md 明文 "地支申酉本气不成势" — 仅本气 ≥ 2 才视为成势, 中气/余气藏可容。
  const base4TouN = (ss.tou('正官')[0] ? 1 : 0) + (ss.tou('七杀')[0] ? 1 : 0)
  const base4MainN = ctx.mainAt('正官').length + ctx.mainAt('七杀').length
  const base4 = base4TouN === 0 && base4MainN < 2
  const ext4TouN = base4TouN + (extras.tou('正官') ? 1 : 0) + (extras.tou('七杀') ? 1 : 0)
  const ext4MainAdd = extras.extraArr.filter(
    (p) => { const s = ctx.zhiMainShishenOf(p); return s === '正官' || s === '七杀' },
  ).length
  const ext4 = ext4TouN === 0 && (base4MainN + ext4MainAdd) < 2

  // —— 条件 6 (md 序号 5): 微泄秀气 — 食伤 (透 + 主气) ≤ 1 ——
  // md 明文 "食神仅一位透干或地支一位根为微泄秀气, 可喜; 食伤多透多根 → 泄过"。
  const base6TouN = (ss.tou('食神')[0] ? 1 : 0) + (ss.tou('伤官')[0] ? 1 : 0)
  const base6MainN = ctx.mainAt('食神').length + ctx.mainAt('伤官').length
  const base6 = (base6TouN + base6MainN) <= 1
  const ext6TouAdd = (extras.tou('食神') ? 1 : 0) + (extras.tou('伤官') ? 1 : 0)
  const ext6MainAdd = extras.extraArr.filter(
    (p) => { const s = ctx.zhiMainShishenOf(p); return s === '食神' || s === '伤官' },
  ).length
  const ext6 = (base6TouN + ext6TouAdd + base6MainN + ext6MainAdd) <= 1

  // —— 条件 5: 财透 ≤ maxCaiTou (附属克气控量) ——
  const baseCaiTou = (ss.tou('正财')[0] ? 1 : 0) + (ss.tou('偏财')[0] ? 1 : 0)
  const extraCaiTouAdd = extras.extraArr.filter(
    (p) => { const s = ctx.ganShishenOf(p); return !!s && CAI_SHISHENS.includes(s) },
  ).length
  const base5 = baseCaiTou <= maxCaiTou
  const ext5 = baseCaiTou + extraCaiTouAdd <= maxCaiTou

  // 稼穑额外: 财 (透 + 主气) 总位严控 < 2
  let base5b = true
  let ext5b = true
  if (selfWx === '土' && maxCaiTou >= 1) {
    const mainCaiMainZhi = ctx.mainZhiArr.filter(
      (s) => s === '正财' || s === '偏财',
    ).length
    const extraCaiMainZhi = extras.extraArr.filter(
      (p) => { const s = ctx.zhiMainShishenOf(p); return s === '正财' || s === '偏财' },
    ).length
    base5b = (baseCaiTou + mainCaiMainZhi) < 2
    ext5b = (baseCaiTou + extraCaiTouAdd + mainCaiMainZhi + extraCaiMainZhi) < 2
  }

  const baseFormed = base2 && base3 && base4 && base5 && base5b && base6
  const withExtrasFormed = ext2 && ext3 && ext4 && ext5 && ext5b && ext6
  const hasExtras = extras.active

  if (!baseFormed && !withExtrasFormed) return null

  // —— 拼 note ——
  const layoutNote = baseLayout || extraLayout
  const ganNote = base3
    ? `${selfWx} 透 ${baseGanN} 位`
    : ext3
      ? `${selfWx} 透 ${baseGanN}+岁运${allGanN - baseGanN}=${allGanN} 位`
      : `${selfWx} 透 ${allGanN} 位`
  const caiNote = baseCaiTou > 0
    ? `, 财透${baseCaiTou}`
    : extraCaiTouAdd > 0
      ? `, 岁运财透${extraCaiTouAdd}`
      : ''

  return {
    baseFormed,
    withExtrasFormed,
    hasExtras,
    note: `${layoutNote} · ${ganNote}${caiNote}`,
  }
}


/**
 * 曲直格 — 甲乙木日主专旺。
 *
 * bazi-skills 5 条 (《渊海子平·曲直仁寿格》):
 *  1. 日主为甲 或 乙木
 *  2. 地支会成木局 — 亥卯未三合 OR 寅卯辰三会 (半合勉强、二字会气降品)
 *  3. 天干多透木 — 日主外另透甲/乙 ≥ 1 位; 壬癸生木更妙
 *  4. 无庚辛金透干克木 — 天干无金透 + 申酉本气不成势
 *  5. 火搭配适度 — 无火偏闷 / 微火"木火通明"复合贵 / 重火耗气降格
 *
 *  前 4 条必满足 (本格依赖 _check)；条件 5 关乎格品高低，本 detector 不
 *  阻塞，木火通明 / 木火相煎 由 categories/wuxing/木火.ts 单独判别。
 */
function isQuZhiGe(ctx: GejuContext): GejuHit | null {
  const r = checkZhuanWang(ctx, '木')
  if (!r) return null
  return emitGeju(
    { name: '曲直格', note: r.note },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 炎上格 — 丙丁火日主专旺。
 *
 * bazi-skills 5 条 (《渊海子平·炎上格》):
 *  1. 日主为丙 或 丁火
 *  2. 地支会成火局 — 寅午戌三合 OR 巳午未三会 (半合勉强成立)
 *  3. 天干多透火 — 日主外另透丙/丁 ≥ 1 位; 甲乙木生火更妙 (薪柴充足)
 *  4. 无壬癸水透干灭火 — 天干无水透 + 亥子本气不成势
 *  5. 土金搭配适度
 *      - 土微泄秀可喜; 土多 → 火土夹带 / 火炎土燥 (降格)
 *      - 金微无害; 金重则忌 (耗火)
 *
 *  前 4 条必满足 (本格依赖 _check)；条件 5 关乎格品高低，本 detector 不
 *  阻塞，火土 / 火金 复合象由 categories/wuxing/ 下相应文件单独判别。
 */
function isYanShangGe(ctx: GejuContext): GejuHit | null {
  const r = checkZhuanWang(ctx, '火')
  if (!r) return null
  return emitGeju(
    { name: '炎上格', note: r.note },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 稼穑格 — 戊己土日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·稼穑格》《三命通会·稼穑》《滴天髓·从象》):
 *  1. 日主为戊 或 己土                                     [静态]
 *  2. 月令为土 — 辰、戌、丑、未之一                        [静态]
 *  3. 地支土气遍布 — 四库俱全 OR 至少 3 位土               [可被岁运补]
 *  4. 无甲乙木透干克土                                      [岁运透木 → Break]
 *  5. 无重水冲土                                            [岁运透水 → Break]
 *  6. (助力) 金点缀泄秀 → "稼穑毓秀" 复合贵格              [可被岁运补 → 升格]
 *
 *  本 detector: 1/2 静态守卫；3/4/5/6 通过 _check + 升格判定 (主局 OR 岁运金) 处理；
 *  emitGeju 将 baseFormed / withExtrasFormed 装配为显/隐/Break。
 */
function isJiaSeGe(ctx: GejuContext): GejuHit | null {
  const extras = ctx.extras
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  // 稼穑特例: 印=火 与"土一气"性质相反, 不计入条件 3 (在此对稼穑额外收紧)。
  // 库支占位 ≥ 3 时, 若 distinct 库 ≥ 3 (三库见层次足) 则 干土 ≥ 2 已够;
  // 若 distinct 库 < 3 (重复库, 层次薄) 则需 干土 ≥ 3 以"一气遍布"补足。
  const SI_KU = new Set(['辰', '戌', '丑', '未'])
  const baseDistinctKu = new Set(
    ctx.mainArr.map((p) => p.pillar.zhi.str).filter((z) => SI_KU.has(z)),
  ).size
  const requireTuGan = baseDistinctKu < 3 ? 3 : 2
  const baseTuGan = ctx.ganWxCount('土')
  const allTuGan = baseTuGan + extras.extraGanWxCount('土')
  if (baseTuGan < requireTuGan && allTuGan < requireTuGan) return null
  const r = checkZhuanWang(ctx, '土', 1)
  if (!r) return null

  // 升格 "稼穑毓秀" — 金点缀 (主局 OR 岁运)
  const baseJinN = ctx.ganWxCount('金') + ctx.zhiMainWxCount('金')
  const extraJinAdd = extras.extraGanWxCount('金') + extras.extraZhiMainWxCount('金')
  const hasJin = baseJinN > 0 || extraJinAdd > 0
  const variantNote = baseJinN > 0
    ? ` · 金点缀 ${baseJinN} 位`
    : extraJinAdd > 0
      ? ` · 岁运金点缀 ${extraJinAdd} 位`
      : ''
  return emitGeju(
    {
      name: '稼穑格',
      note: `月令 ${ctx.monthZhi} ; ${r.note}${variantNote}`,
      ...(hasJin ? { guigeVariant: '稼穑毓秀' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 从革格 — 庚辛金日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·从革格》《穷通宝鉴·庚金章》《滴天髓·从象》):
 *  1. 日主为庚 或 辛金                                       [静态]
 *  2. 地支会成金局 — 巳酉丑三合 OR 申酉戌三会               [可被岁运补]
 *  3. 天干多透金 — 日主外另透庚/辛 ≥ 1 位                   [可被岁运补]
 *  4. 无丙丁火透干熔金                                       [岁运透火 → Break]
 *  5. 无甲乙木过重对抗 — 木为金之财                          [岁运透木 → Break]
 *  6. (助力) 水秀气 → "金白水清" 复合贵格                   [可被岁运补 → 升格]
 *
 *  本 detector: 1 静态；2/3/4/5 由 _check 处理；6 通过本文件 hasShui 计算。
 *  emitGeju 装配 显/隐/Break。
 *
 *  注意: md 明确称该贵格为"金白水清"，本代码字段 guigeVariant 写为
 *  "剑如秋水" 与 md 不同名 (待统一)。
 */
function isCongGeGe(ctx: GejuContext): GejuHit | null {
  const extras = ctx.extras
  const r = checkZhuanWang(ctx, '金')
  if (!r) return null

  const baseShuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const extraShuiAdd = extras.extraGanWxCount('水') + extras.extraZhiMainWxCount('水')
  const hasShui = baseShuiN > 0 || extraShuiAdd > 0
  const variantNote = baseShuiN > 0
    ? ` · 水泄秀 ${baseShuiN} 位`
    : extraShuiAdd > 0
      ? ` · 岁运水泄秀 ${extraShuiAdd} 位`
      : ''
  return emitGeju(
    {
      name: '从革格',
      note: `${r.note}${variantNote}`,
      ...(hasShui ? { guigeVariant: '剑如秋水' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 润下格 — 壬癸水日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·润下格》《穷通宝鉴·壬水章》《滴天髓·从象》):
 *  1. 日主为壬 或 癸水                                       [静态]
 *  2. 地支会成水局 — 申子辰三合 OR 亥子丑三会               [可被岁运补]
 *  3. 天干多透水 — 日主外另透壬/癸 ≥ 1 位                   [可被岁运补]
 *  4. 无戊己土透干克水                                        [岁运透土 → Break]
 *  5. 无重火蒸水 — 丙丁不多透                                [岁运透火 → Break, md 微火反喜未实现]
 *  6. (助力) 金生 / 木泄 → "金白水清" / "水木清华"          [可被岁运补 → 升格]
 *
 *  本 detector: 1 静态；2/3/4/5 由 _check 处理；6 通过本文件 hasMu / hasJin 计算。
 *  emitGeju 装配 显/隐/Break。
 */
function isRunXiaGe(ctx: GejuContext): GejuHit | null {
  const extras = ctx.extras
  const r = checkZhuanWang(ctx, '水')
  if (!r) return null

  const baseMuN = ctx.ganWxCount('木') + ctx.zhiMainWxCount('木')
  const baseJinN = ctx.ganWxCount('金') + ctx.zhiMainWxCount('金')
  const extraMuAdd = extras.extraGanWxCount('木') + extras.extraZhiMainWxCount('木')
  const extraJinAdd = extras.extraGanWxCount('金') + extras.extraZhiMainWxCount('金')
  const hasMu = baseMuN > 0 || extraMuAdd > 0
  const hasJin = baseJinN > 0 || extraJinAdd > 0
  const hasExtra = hasMu || hasJin

  const tags: string[] = []
  if (baseMuN > 0) tags.push(`木泄秀 ${baseMuN} 位`)
  else if (extraMuAdd > 0) tags.push(`岁运木泄秀 ${extraMuAdd} 位`)
  if (baseJinN > 0) tags.push(`金生水 ${baseJinN} 位`)
  else if (extraJinAdd > 0) tags.push(`岁运金生水 ${extraJinAdd} 位`)

  return emitGeju(
    {
      name: '润下格',
      note: `${r.note}${hasExtra ? ` · ${tags.join(' / ')}` : ''}`,
      ...(hasExtra ? { guigeVariant: '润下清华' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

export function isZhuanWangGe(ctx: GejuContext): GejuHit | null {
  const hit =
    isQuZhiGe(ctx) ||
    isYanShangGe(ctx) ||
    isJiaSeGe(ctx) ||
    isCongGeGe(ctx) ||
    isRunXiaGe(ctx)
  return hit ? { ...hit, name: '专旺格', note: `${hit.name} · ${hit.note}` } : null
}
