/** 柱内干支作用：盖头 / 截脚 / 覆载 (依 干支作用.md)。 */
import {
  ganWuxing,
  zhiWuxing,
  GENERATES as GEN,
  CONTROLS as CON,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import type { GanZhiInteraction, WuXing } from './types'

const POS_LABELS: GanZhiInteraction['pos'][] = ['年', '月', '日', '时']

function analyzeOne(p: Pillar, pos: GanZhiInteraction['pos']): GanZhiInteraction {
  const gw = ganWuxing(p.gan)
  const zw = zhiWuxing(p.zhi)
  const base = { pos, gan: p.gan, zhi: p.zhi, ganWx: gw, zhiWx: zw }
  if (!gw || !zw) return { ...base, type: '中性', note: '' }
  if (gw === zw) return { ...base, type: '覆载(同气)', note: '天地同气，力量集中' }
  if (GEN[gw as WuXing] === zw) return { ...base, type: '覆载(得覆)', note: '天干生地支，地支受生' }
  if (GEN[zw as WuXing] === gw) return { ...base, type: '覆载(得载)', note: '地支生天干，天干有根' }
  if (CON[gw as WuXing] === zw) return { ...base, type: '盖头', note: `${gw} 克 ${zw}，地支根基被压` }
  if (CON[zw as WuXing] === gw) return { ...base, type: '截脚', note: `${zw} 克 ${gw}，天干根基被反噬` }
  return { ...base, type: '中性', note: '' }
}

export function analyzePillarsGanZhi(pillars: Pillar[]): GanZhiInteraction[] {
  return pillars.slice(0, 4).map((p, i) => analyzeOne(p, POS_LABELS[i]))
}
