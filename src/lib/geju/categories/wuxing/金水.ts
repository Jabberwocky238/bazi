import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 金水 类 — 金寒水冷 / 金白水清 必互斥, 单次裁断.
 *   寒冷 (病, 冬月): 金水齐透 + 无火调候.
 *   白清 (好象, 秋冬月 + 庚辛日): 水透通根 + 金有根 + 无土火.
 */
type Verdict = '金寒水冷' | '金白水清'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()

  // 金白水清 优先 (条件最严)
  if (
    bazi.dayWx === '金'
    && (bazi.season === '秋' || bazi.season === '冬')
    && bazi.touWx('水') && bazi.rootWx('水')
    && bazi.rootWx('金')
    && !bazi.touWx('土') && !bazi.touWx('火')
  ) {
    const monthIsShenYou = bazi.monthZhi === '申' || bazi.monthZhi === '酉'
    return {
      name: '金白水清',
      note: `${bazi.season}月金水并秀${monthIsShenYou ? '，月令秋金当令' : ''}`,
    }
  }
  // 金寒水冷
  if (
    bazi.season === '冬'
    && (bazi.dayWx === '金' || bazi.dayWx === '水')
    && bazi.touWx('金') && bazi.touWx('水')
    && !bazi.touWx('火')
  ) {
    return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isJinHanShuiLeng(): GejuHit | null { return pick('金寒水冷') }
export function isJinBaiShuiQing(): GejuHit | null { return pick('金白水清') }
