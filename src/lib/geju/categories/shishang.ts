import type { Ctx } from '../ctx'
import type { GejuHit } from '../types'

/**
 * 食神制杀（依《子平真诠》6 条）：
 *  1. 月令本气七杀 OR 七杀透干通根。
 *  2. 食神透干通根。
 *  3. 食杀力量两停（差距不超过 1 倍：食神位数 ≥ 七杀 / 2 且 ≤ 2 倍）。
 *  4. 食神与七杀位置相邻（紧贴）。
 *  5. 无枭印紧贴克食神，除非有财护。
 *  6. 日主不极弱。
 */
export function isShiShenZhiSha(ctx: Ctx): GejuHit | null {
  const monthMainSha = ctx.pillars[1].hideShishen[0] === '七杀'
  const shaTouRoot = ctx.tou('七杀') && ctx.zang('七杀')
  if (!monthMainSha && !shaTouRoot) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  // md 条件 3: 两停
  const shiN = ctx.countOf('食神')
  const shaN = ctx.countOf('七杀')
  if (shaN === 0) return null
  if (shiN * 2 < shaN || shaN * 2 < shiN) return null
  // md 条件 4: 紧贴
  if (!ctx.adjacentTou('食神', '七杀')) return null
  // md 条件 5: 枭夺食
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  // md 条件 6: 非极弱
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return { name: '食神制杀', note: '食杀两停透根紧贴 · 无枭夺食 · 身可任' }
}

/**
 * 枭神夺食（病格，md 无规范成立条件）：
 *  偏印透 + 食神存在 + 无财救。
 *  月令伤官 + 伤官透干 → 结构为伤官格，让位。
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  if (ctx.mainAt('伤官').includes(1) && ctx.tou('伤官')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}

/**
 * 伤官见官（病格，依 md 4 条）：
 *  1. 伤官与正官同时存在，至少一方透干（两方均透最典）。
 *  2. 两者力量均显（非"伤尽"）。
 *  3. 柱位相邻。
 *  4. 无救应（印/财/合皆无）。
 */
export function isShangGuanJianGuan(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null           // 佩印救
  if (ctx.touCat('财')) return null           // 生财救
  return { name: '伤官见官', note: '伤官正官紧贴且无印/财救' }
}

/**
 * 伤官合杀（依 md 5 条）：
 *  1. 阴日主（乙/丁/己/辛/癸）。
 *  2. 伤官与七杀均透干。
 *  3. 位置紧贴。
 *  4. 无争合（伤官或七杀在干上 ≤ 1 位）。
 *  5. 化神（若化）非忌 —— ctx 无法判定喜忌，略。
 */
export function isShangGuanHeSha(ctx: Ctx): GejuHit | null {
  if (ctx.dayYang) return null
  if (!ctx.tou('伤官') || !ctx.tou('七杀')) return null
  if (!ctx.adjacentTou('伤官', '七杀')) return null
  const shangN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = ctx.pillars.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  if (shangN > 1 || shaN > 1) return null
  return { name: '伤官合杀', note: `阴日主 ${ctx.dayGan} 伤官七杀紧贴双透五合，无争合` }
}

/**
 * 食神生财（依《子平真诠·论食神》6 条）：
 *  1. 食神透干通根 OR 月令本气食神。
 *  2. 财星透干通根。
 *  3. 食神与财相邻 (食→财链)。
 *  4. 日主非弱。
 *  5. 无枭夺食 (或有财护)。
 *  6. 无比劫紧贴夺财 (或官杀制)。
 */
export function isShiShenShengCai(ctx: Ctx): GejuHit | null {
  const monthMainShi = ctx.pillars[1].hideShishen[0] === '食神'
  const shiTouRoot = ctx.tou('食神') && ctx.zang('食神')
  if (!monthMainShi && !shiTouRoot) return null
  if (!ctx.tou('食神')) return null              // 生财源头须透
  // md 条件 2: 财透且通根
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  // md 条件 3
  const adjCai =
    ctx.adjacentTou('食神', '正财') || ctx.adjacentTou('食神', '偏财')
  if (!adjCai) return null
  // md 条件 4: 身非弱
  if (ctx.shenRuo) return null
  // md 条件 5
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  // md 条件 6: 比劫紧贴财 (无官杀制)
  const bijieAdjCai =
    ctx.adjacentTou('比肩', '正财') || ctx.adjacentTou('比肩', '偏财') ||
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('劫财', '偏财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '食神生财', note: '食财双透根相邻 · 身非弱 · 无枭紧贴无劫夺' }
}

/**
 * 伤官生财（依 md 5 条）：
 *  1. 伤官透干通根 OR 月令本气。
 *  2. 财星透干通根。
 *  3. 伤→财位置相连，无印阻。
 *  4. 身强。
 *  5. 无正官紧贴；有七杀须被合/制。
 */
export function isShangGuanShengCai(ctx: Ctx): GejuHit | null {
  const monthMainShang = ctx.pillars[1].hideShishen[0] === '伤官'
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  if (!monthMainShang && !shangTouRoot) return null
  if (!ctx.tou('伤官')) return null
  // md 条件 2: 财透通根
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  // md 条件 3: 伤↔财相邻
  const adjCai =
    ctx.adjacentTou('伤官', '正财') || ctx.adjacentTou('伤官', '偏财')
  if (!adjCai) return null
  if (ctx.touCat('印')) return null                           // md: 印阻
  if (!ctx.shenWang) return null                              // md: 必身强
  if (ctx.tou('正官') && ctx.adjacentTou('伤官', '正官')) return null
  return { name: '伤官生财', note: '身强 · 伤财双透根相邻 · 无印阻无官紧贴' }
}

/**
 * 伤官佩印（依 md 5 条）：
 *  1. 伤官透干通根 OR 月令本气。
 *  2. 印透干通根，力不弱于伤官。
 *  3. 身弱。
 *  4. 无财**紧贴**克印。
 *  5. 无正官透。
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuHit | null {
  const monthMainShang = ctx.pillars[1].hideShishen[0] === '伤官'
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  if (!monthMainShang && !shangTouRoot) return null
  if (!ctx.tou('伤官')) return null
  // md 条件 2: 印透通根
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null
  // md 条件 3: 身弱
  if (!ctx.shenRuo) return null
  // md 条件 4: 财紧贴印才破
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
    ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 5: 无正官透
  if (ctx.tou('正官')) return null
  return { name: '伤官佩印', note: '身弱 · 伤印双透根 · 无紧贴财破印 · 无正官透' }
}

/** 食伤混杂（病格）：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuHit | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}

/**
 * 食伤泄秀（依 md 4 条 + 1 辅）：
 *  1. 身强。
 *  2. 食/伤透干通根 OR 月令本气。
 *  3. 不混杂 (食或伤为主)。
 *  4. 无枭印紧贴克食伤 (或有财护)。
 */
export function isShiShangXieXiu(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  const shiTouRoot = ctx.tou('食神') && ctx.zang('食神')
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  const monthMain = ctx.pillars[1].hideShishen[0]
  const monthIsShiShang = monthMain === '食神' || monthMain === '伤官'
  if (!shiTouRoot && !shangTouRoot && !monthIsShiShang) return null
  // md 条件 3: 不混杂 (至少一方仅藏支或不透)
  if (ctx.tou('食神') && ctx.tou('伤官')) return null
  // md 条件 4: 枭紧贴食伤 且 无财救
  const xiaoAdj =
    ctx.adjacentTou('偏印', '食神') || ctx.adjacentTou('偏印', '伤官')
  if (xiaoAdj && !ctx.touCat('财')) return null
  return { name: '食伤泄秀', note: '身旺 · 食/伤透根泄秀 · 清而不杂' }
}
