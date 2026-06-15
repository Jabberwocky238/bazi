import { readBazi, readExtras } from '../../hooks'
import { EMPTY_SUIYUN, deriveVisibility, type GejuHit } from '../../types'

/**
 * 水火木 类 — 寒木向阳 (单格, 三气联动):
 *  ① 木日主 + 月令冬 + 木有根。
 *  ② 火透 (丙/丁) 调候, 火不过烈 (火透 < 3)。
 *  ③ 水 ≥ 1 且 ≤ 火 (无水则火燥, 水过火则寒凝)。
 *
 *  【岁运】火/木运向阳发力; 金/水运寒景加深。
 *    主局未成 + 岁运补火/水达标 → suiyunTrigger;
 *    主局成 + 岁运金水冲散 (水 ≥ 火) → suiyunBreak。
 */
export function judgeHanMu(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  if (bazi.dayWx !== '木') return null
  if (bazi.season !== '冬') return null
  if (!bazi.rootExt('木')) return null

  const natHuoGan = bazi.ganWxCount('火')
  const natShuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水')
  const natHuoN = natHuoGan + bazi.zhiMainWxCount('火')
  const natTouHuo = bazi.touWx('火')
  const natOk = natTouHuo && natHuoGan < 3 && natShuiN >= 1 && natShuiN <= natHuoN

  const exHuoGan = extras.extraGanWxCount('火')
  const exHuoZhi = extras.extraZhiMainWxCount('火')
  const exShuiGan = extras.extraGanWxCount('水')
  const exShuiZhi = extras.extraZhiMainWxCount('水')
  const allHuoGan = natHuoGan + exHuoGan
  const allHuoN = natHuoN + exHuoGan + exHuoZhi
  const allShuiN = natShuiN + exShuiGan + exShuiZhi
  const allTouHuo = natTouHuo || exHuoGan > 0
  const allOk = allTouHuo && allHuoGan < 3 && allShuiN >= 1 && allShuiN <= allHuoN

  if (!natOk && !allOk) return null

  const hasExtra = extras.extraPillars.length > 0
  const suiyunTrigger = hasExtra && !natOk && allOk
  const suiyunBreak = hasExtra && natOk && !allOk

  const tag = suiyunTrigger ? ' · 岁运补齐' : suiyunBreak ? ' · 岁运冲散' : ''
  const 岁运 = {
    ...EMPTY_SUIYUN,
    isSuiyun: true,
    DefaultTrigger: natOk,
    Trigger: suiyunTrigger,
    Break: suiyunBreak,
  }
  return {
    name: '寒木向阳',
    note: `冬木有根 · 火透调候 · 水${allShuiN}≤火${allHuoN}${tag}`,
    岁运,
    显隐: deriveVisibility(岁运),
  }
}
