/** 救应分析（病 → 药 五方式），依 救应.md。 */
import {
  ganWuxing,
  zhiWuxing,
  GENERATES as GEN,
  CONTROLS as CON,
  GENERATED_BY as GEN_BY,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import { catToWx, type Cat, type JiuyingInfo, type JiuyingMethod, type WuXing } from './types'

function findWxInPillars(pillars: Pillar[], wx: WuXing): string[] {
  const hits: string[] = []
  pillars.forEach((p, i) => {
    const pos = ['年', '月', '日', '时'][i]
    if (ganWuxing(p.gan) === wx) hits.push(`${pos}干 ${p.gan}`)
    if (zhiWuxing(p.zhi) === wx) hits.push(`${pos}支 ${p.zhi}`)
  })
  return hits
}

export function analyzeJiuying(
  pillars: Pillar[],
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
    medicineWx = GEN_BY[dayWx]
    reason = `印(${medicineWx})化杀生身 —— 杀印相生，化敌为友`
  } else if (side === 'weak' && sickCat === '财') {
    sickDesc = `财星(${sickWx})过旺耗身`
    method = '制约'
    medicineWx = dayWx
    reason = `比劫(${medicineWx})帮身并克财 —— 一举两得`
  } else if (side === 'weak' && sickCat === '食伤') {
    sickDesc = `食伤(${sickWx})泄身过重`
    method = '制约'
    medicineWx = GEN_BY[dayWx]
    reason = `印(${medicineWx})克食伤并生身 —— 克泄两制`
  } else if (side === 'strong' && sickCat === '印') {
    sickDesc = `印枭(${sickWx})过旺助身`
    method = '制约'
    medicineWx = CON[dayWx]
    reason = `财(${medicineWx})克印切断源头`
  } else if (side === 'strong' && sickCat === '比劫') {
    sickDesc = `比劫(${sickWx})过旺同党拥挤`
    method = '泄化'
    medicineWx = GEN[dayWx]
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
