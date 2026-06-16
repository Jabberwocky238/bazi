/**
 * 格局判定入口。所有 detector 内部直接通过
 * `readBazi() / readShishen() / readStrength() / readExtras()` 拉数据,
 * 不再接收 ctx 参数。
 *
 * detectGeju() 也无参 — 调用方在 `useGejuExtras` 写入岁运后再 detect。
 */
import { create } from 'zustand'
import type { Detector, GejuHit, GejuQuality, GejuCategory, DaYunMeta } from './types'
import { EMPTY_SUIYUN, deriveVisibility } from './types'
import { useBazi, useShishen } from '../shishen'
import { useStrength } from '../strength'
import { useGejuExtras } from './hooks'

export type {
  GejuQuality,
  GejuCategory,
  GejuHit,
  GejuSuiyun,
  GejuVisibility,
  DaYunMeta,
} from './types'
export { EMPTY_SUIYUN, deriveVisibility } from './types'
export { useGejuExtras } from './hooks'

import * as geju from './categories'

export const DETECTORS: Record<string, [Detector, GejuQuality, GejuCategory]> = {
  // 正格 (月令单一十神)
  建禄格: [geju.isJianLuGe, 'good', '正格'],
  阳刃格: [geju.isYangRenGe, 'good', '正格'],
  十神格: [geju.isShiShenGe, 'good', '十神格'],

  // 官杀
  官杀混杂: [geju.isGuanShaHunZa, 'bad', '十神格'],
  官印相生: [geju.isGuanYinXiangSheng, 'good', '十神格'],
  杀印相生: [geju.isShaYinXiangSheng, 'good', '十神格'],
  // 食伤
  食神制杀: [geju.isShiShenZhiSha, 'good', '十神格'],
  枭神夺食: [geju.isXiaoShenDuoShi, 'bad', '十神格'],
  伤官见官: [geju.isShangGuanJianGuan, 'bad', '十神格'],
  伤官合杀: [geju.isShangGuanHeSha, 'good', '十神格'],
  伤官生财: [geju.isShangGuanShengCai, 'good', '十神格'],
  食神生财: [geju.isShiShenShengCai, 'good', '十神格'],
  伤官佩印: [geju.isShangGuanPeiYin, 'good', '十神格'],
  食伤混杂: [geju.isShiShangHunZa, 'bad', '十神格'],
  食伤泄秀: [geju.isShiShangXieXiu, 'good', '十神格'],
  劫财见财: [geju.isJieCaiJianCai, 'bad', '十神格'],
  // 羊刃
  羊刃驾杀: [geju.isYangRenJiaSha, 'neutral', '特殊格'],
  羊刃劫财: [geju.isYangRenJieCai, 'neutral', '特殊格'],
  // 总量
  财官印全: [geju.isCaiGuanYinQuan, 'good', '特殊格'],
  比劫重重: [geju.isBiJieChongChong, 'bad', '十神格'],
  禄马同乡: [geju.isLuMaTongXiang, 'good', '特殊格'],
  以财破印: [geju.isYiCaiPoYin, 'bad', '十神格'],
  财多身弱: [geju.isCaiDuoShenRuo, 'bad', '十神格'],
  // 五行象法 / 两气成象 (per-pattern)
  水火既济: [geju.isShuiHuoJiJi, 'good', '五行格'],
  水火相战: [geju.isShuiHuoXiangZhan, 'bad', '五行格'],
  木火相煎: [geju.isMuHuoXiangJian, 'bad', '五行格'],
  木火通明: [geju.isMuHuoTongMing, 'good', '五行格'],
  木多火塞: [geju.isMuDuoHuoSai, 'bad', '五行格'],
  土金毓秀: [geju.isTuJinYuXiu, 'good', '五行格'],
  土重金埋: [geju.isTuZhongJinMai, 'bad', '五行格'],
  火多金熔: [geju.isHuoDuoJinRong, 'bad', '五行格'],
  火旺金衰: [geju.isHuoWangJinShuai, 'bad', '五行格'],
  金火铸印: [geju.isJinHuoZhuYin, 'good', '五行格'],
  火土夹带: [geju.isHuoTuJiaDai, 'good', '五行格'],
  火炎土燥: [geju.isHuoYanTuZao, 'bad', '五行格'],
  水多木漂: [geju.isShuiDuoMuPiao, 'bad', '五行格'],
  水冷木寒: [geju.isShuiLengMuHan, 'bad', '五行格'],
  水木清华: [geju.isShuiMuQingHua, 'good', '五行格'],
  金寒水冷: [geju.isJinHanShuiLeng, 'bad', '五行格'],
  金白水清: [geju.isJinBaiShuiQing, 'good', '五行格'],
  木疏厚土: [geju.isMuShuHouTu, 'good', '五行格'],
  斧斤伐木: [geju.isFuJinFaMu, 'good', '五行格'],
  寒木向阳: [geju.judgeHanMu, 'good', '特殊格'],
  日照江河: [geju.judgeRiZhao, 'good', '特殊格'],
  // 专旺 / 从格理论互斥，各自只暴露聚合 detector
  专旺格: [geju.isZhuanWangGe, 'good', '专旺格'],
  从格: [geju.isCongGe, 'good', '从格'],
  // 特殊格
  魁罡格: [geju.isKuiGangGe, 'good', '特殊格'],
  三奇格: [geju.isSanQiGe, 'good', '特殊格'],
  三庚格: [geju.isSanGengGe, 'good', '特殊格'],
  化气格: [geju.isHuaQiGe, 'good', '特殊格'],
  天元一气: [geju.isTianYuanYiQi, 'good', '特殊格'],
  日德格: [geju.isRiDeGe, 'good', '特殊格'],
  日贵格: [geju.isRiGuiGe, 'good', '特殊格'],
  身杀两停: [geju.isShenShaLiangTing, 'neutral', '特殊格'],
  帝王命造: [geju.isDiWangMingZao, 'good', '特殊格'],
  壬骑龙背: [geju.isRenQiLongBei, 'good', '特殊格'],
}

export type GejuOutput = GejuHit & { quality: GejuQuality, category: GejuCategory }

export function detectGeju(): GejuOutput[] {
  if (useBazi.getState().pillars.length !== 4) return []
  const hits: GejuOutput[] = []
  for (const [detect, quality, category] of Object.values(DETECTORS)) {
    const h = detect()
    if (!h) continue
    // 从格与专旺格理论互斥；若 detector 边界重叠，按当前顺序只保留先命中的一类。
    if (h.name === '从格' && hits.some((x) => x.name === '专旺格')) continue
    if (h.name === '专旺格') {
      const i = hits.findIndex((x) => x.name === '从格')
      if (i >= 0) hits.splice(i, 1)
    }
    // detector 可只返回 name/note(/guigeVariant), 在此补齐默认 岁运/显隐。
    const 岁运 = h.岁运 ?? { ...EMPTY_SUIYUN }
    const 显隐 = h.显隐 ?? deriveVisibility(岁运)
    hits.push({
      name: h.name,
      note: h.note,
      岁运,
      显隐,
      ...(h.guigeVariant ? { guigeVariant: h.guigeVariant } : {}),
      quality,
      category,
    })
  }
  return hits
}

// ————————————————————————————————————————————————————————
// useGeju — 当前快照下的 hits, 跟随 useBazi / useGejuExtras 自动重算.
// 其他 store 变更通常由 useBazi 主导 (useShishen / useStrength 都基于 pillars).
// ————————————————————————————————————————————————————————

interface GejuStore {
  hits: GejuOutput[]
}

export const useGeju = create<GejuStore>()(() => ({
  hits: detectGeju(),
}))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useGeju.setState({ hits: detectGeju() })
})
useShishen.subscribe(() => {
  useGeju.setState({ hits: detectGeju() })
})
useStrength.subscribe(() => {
  useGeju.setState({ hits: detectGeju() })
})
useGejuExtras.subscribe(() => {
  useGeju.setState({ hits: detectGeju() })
})
