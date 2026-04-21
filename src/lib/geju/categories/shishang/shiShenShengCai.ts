import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

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
  if (!ctx.tou('食神')) return null              // 生财源头须透 (不强求通根)
  // md 条件 2: 财透且通根
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  // md 条件 3
  const adjCai =
    ctx.adjacentTou('食神', '正财') || ctx.adjacentTou('食神', '偏财')
  if (!adjCai) return null
  // md 条件 4: 身不极弱 (身弱有印为宜，note 里提示)
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  // md 条件 5: 枭夺食
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  // md 条件 6: 比劫紧贴财 (无官杀制)
  const bijieAdjCai =
    ctx.adjacentTou('比肩', '正财') || ctx.adjacentTou('比肩', '偏财') ||
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('劫财', '偏财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '食神生财', note: '食神透生财 · 财有根 · 食财相邻' }
}
