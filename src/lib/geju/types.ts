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
  // 默认成格
  suiyunDefaultTrigger?: boolean
  // **岁运冲害 */
  suiyunConquer?: boolean
  // 贵格变体
  guigeVariant?: string
}

export type Detector = (ctx: Ctx) => GejuHit | null

