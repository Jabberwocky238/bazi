import {
  Calculator,
  computeShishenGan,
  computeShishenZhi,
  computeShishenWuxing,
  CANG_GAN,
  ganWuxing,
  zhiWuxing,
  nayinNameOf,
  changshengState,
  type Gan,
  type Zhi,
  type Sex,
  type Pillar,
  type ExtraPillar,
  type DetailedPillar,
} from '@jabberwocky238/bazi-engine'
import {
  parseBaziToResult,
  deriveAll,
  type BaziResult,
} from '@LIB'
import type { ToolContext } from '../toolcall'

// ————————————————————————————————————————————————————————
// 工具箱内部共享辅助 —— 各 tool 文件复用的干支解析 / 排盘派生逻辑。
// ————————————————————————————————————————————————————————

/** "甲子" → { gan:"甲", zhi:"子" }。 */
export function parseGz(gz: string): { gan: Gan; zhi: Zhi } {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

/** "甲子" → { gan:"甲", zhi:"子" }; 非法返回 null。 */
export function parseGz2(gz: string): { gan: Gan; zhi: Zhi } | null {
  const t = gz.trim()
  if (t.length !== 2) return null
  const g = t[0]!
  const z = t[1]!
  // 合法性交由 Calculator 校验, 这里只做长度判断
  return { gan: g as Gan, zhi: z as Zhi }
}

/** 把单个干支字符串构造成 engine DetailedPillar (供 gejuExtras 用), 需日主定十神。 */
export function gzToDetailedPillar(gz: string, dayGan: Gan): DetailedPillar | null {
  const p = parseGz2(gz)
  if (!p) return null
  const cangGanSs = computeShishenZhi(dayGan, p.zhi)
  return {
    label: '时柱' as never,
    gan: {
      name: p.gan,
      wuxing: ganWuxing(p.gan),
      shishen: computeShishenGan(dayGan, p.gan),
    },
    zhi: {
      name: p.zhi,
      wuxing: zhiWuxing(p.zhi),
      cangGan: CANG_GAN[p.zhi].map((g, idx) => ({
        name: g,
        shishen: cangGanSs[idx]!,
        wuxing: computeShishenWuxing(dayGan, cangGanSs[idx]!),
      })),
    },
    nayin: nayinNameOf(p.gan, p.zhi),
    shensha: [],
    changsheng: changshengState(p.gan, p.zhi),
  } as DetailedPillar
}

export {
  Calculator,
  type Pillar,
  type ExtraPillar,
  type DetailedPillar,
  type Sex,
}

/**
 * 从 ctx 取八字 + 选中大运, 一站式 deriveAll:
 * 返回 { derived, dayunPillars } 供三个分析工具复用。
 */
export function deriveFromCtx(ctx: ToolContext): {
  derived: ReturnType<typeof deriveAll> | null
  error?: string
} {
  const basics = (ctx.context as { basics?: { bazi?: string[]; sex?: number } } | undefined)?.basics
  const ui = (ctx.context as { ui?: { dayun?: Array<{ gz?: string }> } } | undefined)?.ui
  const bazi = basics?.bazi ?? []
  if (bazi.length < 3 || !bazi.slice(0, 3).every((g) => g && g.length === 2)) {
    return { derived: null, error: '当前命盘八字不足三柱' }
  }
  const sex = (basics?.sex ?? 1) as Sex
  try {
    const r: BaziResult = parseBaziToResult(
      [bazi[0]!, bazi[1]!, bazi[2]!, bazi[3] ?? ''] as [string, string, string, string],
      sex,
    )
    if (!r.pillars || r.pillars.length !== 4) {
      return { derived: null, error: '排盘失败, 四柱不全' }
    }
    const dayGan = r.dayGan as Gan
    // 选中大运 → DetailedPillar, 作 gejuExtras 参与格局岁运判定
    const dayunPillar = (ui?.dayun ?? [])
      .map((d) => d.gz)
      .filter((g): g is string => !!g && g.length === 2)
      .map((g) => gzToDetailedPillar(g, dayGan))
      .find((p): p is DetailedPillar => !!p)
    const derived = deriveAll(r, dayunPillar ? { dayun: dayunPillar } : {})
    return { derived }
  } catch (e) {
    return { derived: null, error: `排盘/派生失败: ${e instanceof Error ? e.message : String(e)}` }
  }
}
