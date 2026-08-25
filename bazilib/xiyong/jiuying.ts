/** 救应分析（病 → 药 五方式），依 救应.md。 */
import { WuXingC } from '@jabberwocky238/bazi-engine'
import type { DetailedPillar } from '../base'
import { catToWx, type Cat, type JiuyingInfo, type JiuyingMethod, type WuXing } from './types'

/** 五行生克查询 —— 走 engine 的 relationFrom, 不自维生克表。 */
const wx = (w: WuXing, rel: '生我' | '我生' | '我克' | '克我' | '同类'): WuXing =>
  WuXingC.from(w).relationFrom(rel).str


function findWxInPillars(pillars: DetailedPillar[], wx: WuXing): string[] {
  const hits: string[] = []
  pillars.forEach((p, i) => {
    const pos = ['年', '月', '日', '时'][i]
    if (p.pillar.gan.wuxing.str === wx) hits.push(`${pos}干 ${p.pillar.gan.str}`)
    if (p.pillar.zhi.wuxing.str === wx) hits.push(`${pos}支 ${p.pillar.zhi.str}`)
  })
  return hits
}

export function analyzeJiuying(
  pillars: DetailedPillar[],
  dayWx: WuXing,
  side: 'strong' | 'weak' | 'neutral',
  sickCat: Cat | null,
): JiuyingInfo {
  if (!sickCat) {
    return {
      sickDesc: '无明显病根',
      method: null,
      medicineWx: null,
      medicinePresent: false,
      medicineNote: '',
      reason: '命局相对平衡，无需特定救应',
    }
  }
  const sickWx = catToWx(dayWx, sickCat)
  let method: JiuyingMethod = null
  let medicineWx: WuXing | null = null
  let reason = ''
  let sickDesc = ''

  if (side === 'weak' && sickCat === '官杀') {
    sickDesc = `官杀(${sickWx})过旺克身`
    method = '泄化'
    medicineWx = wx(dayWx, '生我')
    reason = `印(${medicineWx})化杀生身 —— 杀印相生，化敌为友`
  } else if (side === 'weak' && sickCat === '财') {
    sickDesc = `财星(${sickWx})过旺耗身`
    method = '制约'
    medicineWx = dayWx
    reason = `比劫(${medicineWx})帮身并克财 —— 一举两得`
  } else if (side === 'weak' && sickCat === '食伤') {
    sickDesc = `食伤(${sickWx})泄身过重`
    method = '制约'
    medicineWx = wx(dayWx, '生我')
    reason = `印(${medicineWx})克食伤并生身 —— 克泄两制`
  } else if (side === 'strong' && sickCat === '印') {
    sickDesc = `印枭(${sickWx})过旺助身`
    method = '制约'
    medicineWx = wx(dayWx, '我克')
    reason = `财(${medicineWx})克印切断源头`
  } else if (side === 'strong' && sickCat === '比劫') {
    sickDesc = `比劫(${sickWx})过旺同党拥挤`
    method = '泄化'
    medicineWx = wx(dayWx, '我生')
    reason = `食伤(${medicineWx})泄秀 —— 比劫旺喜泄不喜克`
  } else {
    sickDesc = `${sickCat}(${sickWx}) 过重`
    reason = '病根模糊，需合冲刑害再审'
  }

  const medicineHits = medicineWx ? findWxInPillars(pillars, medicineWx) : []
  const medicinePresent = medicineHits.length > 0
  const medicineNote = medicineWx
    ? medicinePresent
      ? `药${medicineWx}在局：${medicineHits.join('、')}`
      : `药${medicineWx}原局缺 —— 需大运/流年引动 (md：有病 + 药引，等大运激活)`
    : ''

  return { sickDesc, method, medicineWx, medicinePresent, medicineNote, reason }
}
