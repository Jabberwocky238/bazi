import type { Ctx } from './ctx'

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

export interface GejuHit {
  name: string
  note: string
  /** 是否为岁运（大运/流年）特定触发的判定（默认 undefined 为原局判定）。 */
  suiyunSpecific?: boolean
  /** 原局不成格，**岁运成格**（大运/流年补齐）。 */
  suiyunTrigger?: boolean
  /** 原局成格，**岁运破格**（大运/流年冲散）。 */
  suiyunBreak?: boolean
}

export type Detector = (ctx: Ctx) => GejuHit | null

export type ShishenCat = '比劫' | '印' | '食伤' | '财' | '官杀'

export const SHI_SHEN_CAT: Record<string, ShishenCat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}
