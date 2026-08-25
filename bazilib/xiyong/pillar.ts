/** 柱内干支作用：盖头 / 截脚 / 覆载 (依 干支作用.md)。 */
import type { DetailedPillar } from '../base'
import type { GanZhiInteraction } from './types'

const POS_LABELS: GanZhiInteraction['pos'][] = ['年', '月', '日', '时']

/**
 * 单柱干支作用 —— 以 WuXingC.relationOf 判生克, 不再自维生克表。
 * 关系相对天干五行 gw 而言: 我生=天干生地支(得覆), 生我=地支生天干(得载),
 * 我克=盖头, 克我=截脚, 同类=同气。
 */
function analyzeOne(p: DetailedPillar, pos: GanZhiInteraction['pos']): GanZhiInteraction {
  const gw = p.pillar.gan.wuxing
  const zw = p.pillar.zhi.wuxing
  const base = { pos, gan: p.pillar.gan.str, zhi: p.pillar.zhi.str, ganWx: gw.str, zhiWx: zw.str }
  switch (gw.relationOf(zw)) {
    case '同类': return { ...base, type: '覆载(同气)', note: '天地同气，力量集中' }
    case '我生': return { ...base, type: '覆载(得覆)', note: '天干生地支，地支受生' }
    case '生我': return { ...base, type: '覆载(得载)', note: '地支生天干，天干有根' }
    case '我克': return { ...base, type: '盖头', note: `${gw.str} 克 ${zw.str}，地支根基被压` }
    case '克我': return { ...base, type: '截脚', note: `${zw.str} 克 ${gw.str}，天干根基被反噬` }
  }
}

export function analyzePillarsGanZhi(pillars: DetailedPillar[]): GanZhiInteraction[] {
  return pillars.slice(0, 4).map((p, i) => analyzeOne(p, POS_LABELS[i]))
}
